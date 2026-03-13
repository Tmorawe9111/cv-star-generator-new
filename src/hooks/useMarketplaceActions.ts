import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useConnections } from "@/hooks/useConnections";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { ConnectionState } from "@/hooks/useConnections";
import type { MarketplacePost, MarketplaceJob } from "@/types/marketplace";

/** Haptic feedback helper */
export function triggerHaptic(type: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

export interface UseMarketplaceActionsOptions {
  setStatusMap: React.Dispatch<
    React.SetStateAction<Record<string, ConnectionState>>
  >;
  invalidatePosts?: () => Promise<void>;
}

export interface UseMarketplaceActionsResult {
  onConnect: (targetId: string) => Promise<void>;
  handleLikePost: (postId: string, liked: boolean) => Promise<void>;
  handleSubmitComment: (
    post: MarketplacePost,
    commentText: string,
    onSuccess: () => void
  ) => Promise<void>;
}

export function useMarketplaceActions({
  setStatusMap,
  invalidatePosts,
}: UseMarketplaceActionsOptions): UseMarketplaceActionsResult {
  const { user } = useAuth();
  const { requestConnection } = useConnections();

  const onConnect = useCallback(
    async (targetId: string) => {
      if (!user) {
        window.location.href = "/anmelden";
        return;
      }
      setStatusMap((prev) => ({ ...prev, [targetId]: "pending" }));
      triggerHaptic("light");
      toast({ title: "✨ Anfrage gesendet" });
      try {
        await requestConnection(targetId);
      } catch {
        setStatusMap((prev) => ({ ...prev, [targetId]: "none" }));
        toast({ title: "Fehler", variant: "destructive" });
      }
    },
    [user, requestConnection, setStatusMap]
  );

  const handleLikePost = useCallback(
    async (postId: string, liked: boolean) => {
      if (!user) {
        toast({ title: "Bitte anmelden", variant: "destructive" });
        return;
      }
      triggerHaptic("light");
      try {
        if (liked) {
          await supabase
            .from("post_likes")
            .insert({ post_id: postId, user_id: user.id });
        } else {
          await supabase
            .from("post_likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);
        }
        await invalidatePosts?.();
      } catch (e) {
        console.error("Like error:", e);
      }
    },
    [user, invalidatePosts]
  );

  const handleSubmitComment = useCallback(
    async (
      post: MarketplacePost,
      commentText: string,
      onSuccess: () => void
    ) => {
      if (!user || !commentText.trim()) return;
      try {
        await supabase.from("post_comments").insert({
          post_id: post.id,
          user_id: user.id,
          content: commentText.trim(),
        });
        toast({ title: "💬 Kommentar gepostet!" });
        onSuccess();
        await invalidatePosts?.();
      } catch {
        toast({ title: "Fehler", variant: "destructive" });
      }
    },
    [user, invalidatePosts]
  );

  return { onConnect, handleLikePost, handleSubmitComment };
}
