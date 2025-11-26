import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

interface CompanyLatestPostsProps {
  companyId: string;
}

export function CompanyLatestPosts({ companyId }: CompanyLatestPostsProps) {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["company-posts-preview", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts" as any)
        .select("id, content, created_at")
        .eq("user_id", companyId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <Card className="p-2 sm:p-3 md:p-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3 md:p-4 pb-2 sm:pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          Letzte Beiträge
        </CardTitle>
        <Button variant="link" size="sm" asChild>
          <Link to={`?tab=posts`}>Alle anzeigen →</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 md:p-4 pt-0 sm:pt-0 md:pt-0">
        {isLoading && <div className="text-xs sm:text-sm text-muted-foreground">Lade Beiträge...</div>}
        
        {!isLoading && posts?.length === 0 && (
          <div className="text-center py-4 sm:py-6 md:py-8">
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">Noch keine Beiträge</p>
          </div>
        )}
        
        {!isLoading && posts && posts.length > 0 && (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 sm:gap-4 pb-4">
              {posts.map((post) => (
                <Card key={post.id} className="w-[240px] sm:w-[300px] shrink-0">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm line-clamp-3">{post.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(post.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
