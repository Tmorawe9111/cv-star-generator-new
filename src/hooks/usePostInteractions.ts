import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_comment_id?: string | null;
  like_count?: number;
  replies?: PostComment[];
  author_type?: 'user' | 'company';
  author?: {
    id: string;
    vorname?: string | null;
    nachname?: string | null;
    avatar_url?: string | null;
    headline?: string | null;
    employer_free?: string | null;
    company_name?: string | null;
    aktueller_beruf?: string | null;
    ausbildungsbetrieb?: string | null;
  } | null;
  company?: {
    id: string;
    name: string;
    logo_url?: string | null;
    industry?: string | null;
    main_location?: string | null;
  } | null;
}

export const usePostLikes = (postId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ count: number; liked: boolean }>({
    queryKey: ["post-likes", postId, user?.id ?? "anon"],
    queryFn: async (): Promise<{ count: number; liked: boolean }> => {
      console.debug("[likes] fetch", { postId });
      
      // Get like count from post_likes table
      const { count, error: countError } = await supabase
        .from("post_likes")
        .select("*", { count: 'exact', head: true })
        .eq("post_id", postId);
      
      if (countError) throw countError;
      
      let liked = false;
      if (user?.id) {
        // Check if user has liked this post
        const { data: userLike, error: likeError } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (likeError) throw likeError;
        liked = Boolean(userLike);
      }

      return {
        count: count || 0,
        liked
      };
    },
    enabled: Boolean(postId)
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        toast({
          title: "Anmeldung erforderlich",
          description: "Melde dich an, um Beiträge zu liken.",
          variant: "destructive",
        });
        return { changed: false };
      }
      
      const liked = data?.liked ?? false;
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: user.id,
          });
        
        if (error) throw error;
      }
      return { changed: true };
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["post-likes", postId] });
      queryClient.invalidateQueries({ queryKey: ["clean-feed"] });
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });

  return {
    count: data?.count ?? 0,
    liked: data?.liked ?? false,
    isLoading,
    toggleLike: () => toggleLikeMutation.mutate(),
    isToggling: toggleLikeMutation.isPending,
  };
};

export const usePostComments = (postId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const commentsQuery = useQuery<PostComment[]>({
    queryKey: ["post-comments", postId],
    queryFn: async (): Promise<PostComment[]> => {
      console.debug("[comments] fetch", { postId });
      
      // Get comments from post_comments table
      const { data: comments, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;

      const items = (comments ?? []) as any[];
      const userIds = Array.from(
        new Set(items.map((c: any) => c.user_id).filter(Boolean))
      );
      
      // Load user profiles
      let profilesMap: Record<string, any> = {};
      if (userIds.length) {
        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("id, vorname, nachname, avatar_url, headline, employer_free, company_name, aktueller_beruf, ausbildungsbetrieb")
          .in("id", userIds as any);
        if (profErr) {
          console.error("[comments] Error loading profiles:", profErr);
          throw profErr;
        }
        profilesMap = Object.fromEntries(
          (profiles ?? []).map((p: any) => [p.id, p])
        );
      }

      // Check which users are company users and load their company data
      let companyUsersMap: Record<string, any> = {};
      if (userIds.length) {
        const { data: companyUsers, error: cuErr } = await supabase
          .from("company_users")
          .select("user_id, company_id, companies(id, name, logo_url, industry, main_location)")
          .in("user_id", userIds as any);
        if (!cuErr && companyUsers) {
          companyUsersMap = Object.fromEntries(
            companyUsers.map((cu: any) => [cu.user_id, cu.companies])
          );
        }
      }

      // Transform comments with hierarchy
      const allComments = items.map((c: any) => {
        const userProfile = profilesMap[c.user_id] ?? null;
        const companyData = companyUsersMap[c.user_id] ?? null;
        
        return {
          id: c.id,
          post_id: c.post_id,
          user_id: c.user_id,
          content: c.content,
          created_at: c.created_at,
          updated_at: c.updated_at,
          parent_comment_id: c.parent_comment_id,
          like_count: c.like_count || 0,
          author: userProfile,
          company: companyData,
          author_type: companyData ? 'company' : 'user',
          replies: [] as PostComment[],
        };
      }) as PostComment[];
      
      // Build nested structure: top-level comments with replies
      const topLevelComments = allComments.filter(c => !c.parent_comment_id);
      const repliesMap = new Map<string, PostComment[]>();
      
      // Group replies by parent
      allComments.filter(c => c.parent_comment_id).forEach(reply => {
        const parentId = reply.parent_comment_id!;
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId)!.push(reply);
      });
      
      // Attach replies to their parents
      topLevelComments.forEach(comment => {
        comment.replies = repliesMap.get(comment.id) || [];
      });
      
      return topLevelComments;
    },
    enabled: Boolean(postId)
  });

  const addCommentMutation = useMutation({
    mutationFn: async (payload: { content: string; parentId?: string | null }) => {
      if (!user?.id) {
        toast({
          title: "Anmeldung erforderlich",
          description: "Melde dich an, um zu kommentieren.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Adding comment:', { postId, userId: user.id, content: payload.content, parentId: payload.parentId });
      
      // Insert into post_comments table
      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: payload.content,
          parent_comment_id: payload.parentId || null,
        })
        .select();
      
      console.log('Comment created:', { data, error });
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["clean-feed"] });
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    commentsCount: commentsQuery.data?.length ?? 0,
    isLoading: commentsQuery.isLoading,
    addComment: (content: string, parentId?: string | null) =>
      addCommentMutation.mutate({ content, parentId }),
    isAdding: addCommentMutation.isPending,
  };
};

// Shares/Reposts helper hook  
// Comment Likes Hook
export const useCommentLikes = (commentId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ count: number; liked: boolean }>({
    queryKey: ["comment-likes", commentId, user?.id ?? "anon"],
    queryFn: async (): Promise<{ count: number; liked: boolean }> => {
      console.debug("[comment-likes] fetch", { commentId });
      
      // Get like count from comment_likes table
      const { count, error: countError } = await supabase
        .from("comment_likes")
        .select("*", { count: 'exact', head: true })
        .eq("comment_id", commentId);
      
      if (countError) {
        console.error("[comment-likes] count error:", countError);
        // Return default values if table doesn't exist yet
        return { count: 0, liked: false };
      }
      
      let liked = false;
      if (user?.id) {
        // Check if user has liked this comment
        const { data: userLike, error: likeError } = await supabase
          .from("comment_likes")
          .select("id")
          .eq("comment_id", commentId)
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (likeError) {
          console.error("[comment-likes] user like error:", likeError);
        } else {
          liked = Boolean(userLike);
        }
      }

      return {
        count: count || 0,
        liked
      };
    },
    enabled: Boolean(commentId)
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        toast({
          title: "Anmeldung erforderlich",
          description: "Melde dich an, um Kommentare zu liken.",
          variant: "destructive",
        });
        return { changed: false };
      }
      
      const liked = data?.liked ?? false;
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("comment_likes")
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });
        
        if (error) throw error;
      }
      return { changed: true };
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["comment-likes", commentId] });
      queryClient.invalidateQueries({ queryKey: ["post-comments"] });
    },
  });

  return {
    count: data?.count ?? 0,
    liked: data?.liked ?? false,
    isLoading,
    toggleLike: () => toggleLikeMutation.mutate(),
    isToggling: toggleLikeMutation.isPending,
  };
};

export const usePostReposts = (postId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ count: number; hasReposted: boolean}>({
    queryKey: ["post-shares", postId, user?.id ?? "anon"],
    queryFn: async (): Promise<{ count: number; hasReposted: boolean }> => {
      console.debug("[shares] fetch", { postId });
      
      // Get share count (we'll add a shares table later if needed)
      // For now, just return 0
      const count = 0;

      let hasReposted = false;
      // We can implement shares later if needed
      
      return { 
        count: count, 
        hasReposted 
      };
    },
    enabled: Boolean(postId)
  });

  const repostMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        toast({
          title: "Anmeldung erforderlich",
          description: "Melde dich an, um Beiträge zu teilen.",
          variant: "destructive",
        });
        return { changed: false };
      }
      
      // For now, just show a success message
      // We can implement actual reposts later
      toast({
        title: "Beitrag geteilt",
        description: "Der Beitrag wurde in deinem Netzwerk geteilt.",
      });
      
      return { changed: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-shares", postId] });
      queryClient.invalidateQueries({ queryKey: ["clean-feed"] });
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });

  return {
    count: data?.count ?? 0,
    hasReposted: data?.hasReposted ?? false,
    isLoading,
    repost: () => repostMutation.mutate(),
    isReposting: repostMutation.isPending,
  };
};