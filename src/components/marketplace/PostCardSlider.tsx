import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketplacePost } from "@/types/marketplace";

export interface PostCardSliderProps {
  post: MarketplacePost;
  author?: { name: string; avatar_url: string | null };
  onLike?: (postId: string, liked: boolean) => void;
  onComment?: (post: MarketplacePost) => void;
  isLiked?: boolean;
}

export const PostCardSlider: React.FC<PostCardSliderProps> = ({
  post,
  author,
  onLike,
  onComment,
  isLiked = false,
}) => {
  const [liked, setLiked] = React.useState(isLiked);
  const [likesCount, setLikesCount] = React.useState(post.likes_count ?? 0);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));
    onLike?.(post.id, newLiked);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onComment?.(post);
  };

  return (
    <div className="min-w-[280px] max-w-[280px] h-[200px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={author?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">
            {(author?.name || "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-xs text-gray-900 truncate">
            {author?.name || "Unbekannt"}
          </p>
          <p className="text-[10px] text-gray-500">
            {new Date(post.created_at).toLocaleDateString("de-DE")}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700 line-clamp-4 flex-1 leading-relaxed">
        {post.content}
      </p>
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-50 text-xs">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1 transition-all active:scale-90",
            liked ? "text-red-500" : "text-gray-500 hover:text-red-400"
          )}
        >
          <Heart
            className={cn("h-4 w-4 transition-transform", liked && "fill-current scale-110")}
          />{" "}
          {likesCount}
        </button>
        <button
          onClick={handleComment}
          className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors active:scale-90"
        >
          <MessageCircle className="h-4 w-4" /> {post.comments_count ?? 0}
        </button>
      </div>
    </div>
  );
};
