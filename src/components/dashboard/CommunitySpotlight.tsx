import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CommunityPost } from "@/types/dashboard";

export interface CommunitySpotlightProps {
  posts: CommunityPost[];
}

export function CommunitySpotlight({ posts }: CommunitySpotlightProps) {
  const spotlightPosts = posts.length
    ? posts.slice(0, 3).map((post) => ({
        title: post.title,
        context: post.topic ?? "Community",
      }))
    : [
        { title: "3 neue Diskussionen zum Arbeitgeber-Branding", context: "Community Forum" },
        { title: "Best Practices: Onboarding für Azubis", context: "HR-Netzwerk" },
        { title: "Erfahrungsbericht: Erfolgreiche Messekontakte", context: "Recruiter-Stammtisch" },
      ];

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Community</p>
        <CardTitle className="text-lg">Aus Ihrer Branche</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {spotlightPosts.map((post) => (
          <div key={post.title} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-800">{post.title}</p>
            <p className="text-xs text-muted-foreground">{post.context}</p>
          </div>
        ))}
        <div className="pt-2 text-right">
          <Button variant="outline" size="sm" className="rounded-full">
            Zur Community
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
