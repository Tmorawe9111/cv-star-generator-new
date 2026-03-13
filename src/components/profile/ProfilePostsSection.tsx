import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Repeat2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import PostCard from "@/components/community/PostCard";

interface ProfilePostsSectionProps {
  profileId: string;
  isOwner?: boolean;
  isCompany?: boolean;
  companyId?: string;
}

type SortOption = "newest" | "relevant";
type FilterOption = "all" | "own" | "reposted";

export function ProfilePostsSection({ 
  profileId, 
  isOwner = false, 
  isCompany = false,
  companyId 
}: ProfilePostsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<SortOption>("newest");
  const [filter, setFilter] = useState<FilterOption>("all");

  // Fetch posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ["profile-posts", profileId, sort, filter, isCompany, companyId],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select("*")
        .eq("status", "published");

      // Track repost IDs for later use
      let repostPostIds: string[] = [];

      if (isCompany && companyId) {
        // Company posts: show company's own posts and reposts
        const { data: repostIds } = await supabase
          .from("post_reposts")
          .select("post_id")
          .eq("reposter_id", companyId)
          .eq("reposter_type", "company");

        repostPostIds = repostIds?.map(r => r.post_id) || [];
        
        // Get company's own posts
        const { data: ownPosts } = await supabase
          .from("posts")
          .select("id")
          .eq("company_id", companyId)
          .eq("author_type", "company");
        
        const ownPostIds = ownPosts?.map(p => p.id) || [];
        
        // Apply filter
        if (filter === "own") {
          // Only own posts
          query = query.in("id", ownPostIds);
        } else if (filter === "reposted") {
          // Only reposted posts
          query = query.in("id", repostPostIds);
        } else {
          // All posts (own + reposted)
          const allPostIds = [...new Set([...ownPostIds, ...repostPostIds])];
          if (allPostIds.length > 0) {
            query = query.in("id", allPostIds);
          } else {
            query = query.eq("company_id", companyId).eq("author_type", "company");
          }
        }
      } else {
        // User posts - check if company user can view
        if (isCompany && companyId) {
          // Check follow relationship
          const { data: followRelation } = await supabase
            .from("follows")
            .select("id")
            .or(`and(follower_type.eq.company,follower_id.eq.${companyId},followee_type.eq.profile,followee_id.eq.${profileId},status.eq.accepted),and(follower_type.eq.profile,follower_id.eq.${profileId},followee_type.eq.company,followee_id.eq.${companyId},status.eq.accepted)`)
            .maybeSingle();

          if (!followRelation) {
            // No follow relationship - return empty array
            return [];
          }
        }
        
        query = query.eq("user_id", profileId).eq("author_type", "user");
      }

      // Apply sorting
      if (sort === "newest") {
        query = query.order("created_at", { ascending: false });
      } else {
        // For relevance, we'll sort after fetching using engagement scores
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      let finalPosts = data || [];

      // If sorting by relevance, get engagement scores and sort
      if (sort === "relevant" && finalPosts.length > 0) {
        const { data: engagementData } = await supabase
          .from("posts_with_engagement")
          .select("id, engagement_score")
          .in("id", finalPosts.map((p: any) => p.id));
        
        const engagementMap = new Map(engagementData?.map((e: any) => [e.id, e.engagement_score]) || []);
        
        // Sort by engagement score, then by date
        finalPosts.sort((a: any, b: any) => {
          const scoreA = engagementMap.get(a.id) || 0;
          const scoreB = engagementMap.get(b.id) || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }

      // Load author and company data separately
      const posts = finalPosts;
      const userIds = [...new Set(posts.filter(p => p.author_type === 'user' && p.user_id).map(p => p.user_id))];
      const companyIds = [...new Set(posts.filter(p => p.author_type === 'company' && p.company_id).map(p => p.company_id))];
      const postIds = posts.map((p: any) => p.id);

      const authorsMap = new Map();
      const companiesMap = new Map();

      if (userIds.length > 0) {
        const { data: authors } = await supabase
          .from("profiles")
          .select("id, vorname, nachname, avatar_url, headline, employer_free, aktueller_beruf, ausbildungsberuf, ausbildungsbetrieb, company_name")
          .in("id", userIds);
        authors?.forEach(a => authorsMap.set(a.id, a));
      }

      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from("companies")
          .select("id, name, logo_url, industry, main_location, description")
          .in("id", companyIds);
        companies?.forEach(c => companiesMap.set(c.id, c));
      }

      // Get like and comment counts
      const { data: likeCounts } = await supabase
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds);
      
      const { data: commentCounts } = await supabase
        .from("post_comments")
        .select("post_id")
        .in("post_id", postIds);

      const likeMap = new Map();
      const commentMap = new Map();

      likeCounts?.forEach(l => {
        likeMap.set(l.post_id, (likeMap.get(l.post_id) || 0) + 1);
      });

      commentCounts?.forEach(c => {
        commentMap.set(c.post_id, (commentMap.get(c.post_id) || 0) + 1);
      });

      const enrichedPosts = posts.map((post: any) => ({
        ...post,
        author: post.author_type === 'user' ? authorsMap.get(post.user_id) : null,
        company: post.author_type === 'company' ? companiesMap.get(post.company_id) : null,
        // Mark if this is a repost
        isRepost: isCompany && companyId ? repostPostIds.includes(post.id) : false,
        // Add like and comment counts
        like_count: likeMap.get(post.id) || 0,
        comment_count: commentMap.get(post.id) || 0,
      }));

      return enrichedPosts;
    },
    enabled: !!profileId,
  });

  // Handle repost
  const handleRepost = async (postId: string) => {
    if (!user || !companyId) {
      toast({
        title: "Fehler",
        description: "Nur Unternehmen können Beiträge reposten.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is a company member
    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (!companyUser || !companyUser.company_id) {
      toast({
        title: "Fehler",
        description: "Du musst Mitglied des Unternehmens sein, um Beiträge zu reposten.",
        variant: "destructive",
      });
      return;
    }

    // Check if already reposted
    const { data: existingRepost } = await supabase
      .from("post_reposts")
      .select("id")
      .eq("post_id", postId)
      .eq("reposter_id", companyId)
      .eq("reposter_type", "company")
      .maybeSingle();

    if (existingRepost) {
      toast({
        title: "Bereits repostet",
        description: "Dieser Beitrag wurde bereits von deinem Unternehmen repostet.",
      });
      return;
    }

    // Create repost
    const { error: repostError } = await supabase
      .from("post_reposts")
      .insert({
        post_id: postId,
        reposter_id: companyId,
        reposter_type: "company",
      });

    if (repostError) {
      toast({
        title: "Fehler",
        description: "Beitrag konnte nicht repostet werden.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Erfolgreich repostet",
      description: "Der Beitrag wurde auf deinem Unternehmensprofil geteilt.",
    });

    // Invalidate query to refresh posts
    queryClient.invalidateQueries({ queryKey: ["profile-posts", profileId, sort, isCompany] });
  };

  // Show ALL posts horizontally (from right to left)
  const horizontalPosts = posts || [];

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Beiträge werden geladen...
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        {isCompany ? "Noch keine Unternehmensbeiträge vorhanden." : "Noch keine Beiträge vorhanden."}
      </div>
    );
  }

  console.log('[ProfilePostsSection] Rendering posts:', posts.length, posts);

  return (
    <div className="space-y-4 w-full">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Beiträge</h3>
        <div className="flex items-center gap-2">
          {/* Filter: All / Own / Reposted (only for companies) */}
          {isCompany && companyId && (
            <Select value={filter} onValueChange={(value) => setFilter(value as FilterOption)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="own">Eigene</SelectItem>
                <SelectItem value="reposted">Reposted</SelectItem>
              </SelectContent>
            </Select>
          )}
          {/* Sort: Newest / Relevant */}
          <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sortieren nach" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Neueste</SelectItem>
              <SelectItem value="relevant">Meiste Relevanz</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Horizontal scroll for ALL posts (from right to left) */}
      {horizontalPosts.length > 0 && (
        <div className="w-full">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" dir="rtl">
            {horizontalPosts.map((post: any) => {
              const postCardData = {
                id: post.id,
                content: post.content ?? '',
                image_url: post.image_url ?? null,
                media: Array.isArray(post.media) ? post.media : [],
                documents: Array.isArray(post.documents) ? post.documents : [],
                user_id: post.user_id,
                author_type: post.author_type === 'company' ? 'company' : 'user',
                author_id: post.author_id ?? post.user_id,
                company_id: post.company_id ?? null,
                like_count: post.like_count ?? 0,
                comment_count: post.comment_count ?? 0,
                share_count: post.share_count ?? 0,
                created_at: post.created_at,
                post_type: post.post_type ?? 'text',
                post_meta: post.post_meta ?? undefined,
                job_id: post.job_id ?? null,
                applies_enabled: post.applies_enabled ?? false,
                cta_label: post.cta_label ?? null,
                cta_url: post.cta_url ?? null,
                promotion_theme: post.promotion_theme ?? null,
                author: post.author || null,
                company: post.company || null,
                job: post.job || null,
              };

              return (
                <div key={post.id} className="flex-shrink-0 w-[320px] snap-start" dir="ltr">
                  <PostCard post={postCardData} />
                  {/* Repost button for companies viewing user posts */}
                  {isCompany && companyId && post.author_type === "user" && !post.isRepost && (
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRepost(post.id)}
                        title="Beitrag reposten"
                        className="text-xs"
                      >
                        <Repeat2 className="h-3.5 w-3.5 mr-1" />
                        Reposten
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

