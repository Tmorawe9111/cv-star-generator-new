import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useCommentLikes, type PostComment } from '@/hooks/usePostInteractions';
import { useCompany } from '@/hooks/useCompany';

interface CommentItemProps {
  comment: PostComment;
  onReply: (commentId: string, name: string) => void;
  depth?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, depth = 0 }) => {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [showReplies, setShowReplies] = useState(false);
  
  const { count: likeCount, liked, toggleLike, isToggling } = useCommentLikes(comment.id);

  // Check if current user is a company user
  const isCompanyUser = !!company?.id;

  // Determine if comment is from a company
  const isCompanyComment = comment.author_type === 'company' && comment.company;
  
  // Determine profile route for comment author
  const getProfileRoute = () => {
    // If current user is a company user, they should NEVER see user profiles
    if (isCompanyUser) {
      // If it's the company's own comment (by company_id match), go to own company profile with posts tab
      if (comment.company?.id === company?.id) {
        return `/company/profile?tab=posts`;
      }
      // If comment is from another company, go to that company's public profile
      if (isCompanyComment && comment.company?.id) {
        return `/companies/${comment.company.id}`;
      }
      // Company users CAN click on user profiles (but see restricted view)
      if (comment.author?.id || comment.user_id) {
        // Use profile_slug if available, otherwise fallback to ID
        if (comment.author?.profile_slug) {
          return `/profil/${comment.author.profile_slug}`;
        }
        return `/u/${comment.author?.id || comment.user_id}`;
      }
      return null;
    }
    
    // Regular user logic
    if (isCompanyComment && comment.company?.id) {
      return `/companies/${comment.company.id}`;
    }
    
    // User profile - use profile_slug if available
    if (comment.author?.profile_slug) {
      return `/profil/${comment.author.profile_slug}`;
    }
    return `/u/${comment.author?.id || comment.user_id}`;
  };
  
  const profileRoute = getProfileRoute();
  
  // Get name - prioritize company name, then user full name, then partial name
  // For company users viewing user profiles: only show vorname if nachname is not available (not unlocked)
  const name = isCompanyComment && comment.company?.name
    ? comment.company.name
    : (isCompanyUser && comment.author_type === 'user'
      ? (comment.author?.vorname && comment.author?.nachname
        ? `${comment.author.vorname} ${comment.author.nachname}`
        : (comment.author?.vorname
          ? comment.author.vorname
          : 'Nutzer'))
      : (comment.author?.vorname && comment.author?.nachname
        ? `${comment.author.vorname} ${comment.author.nachname}`
        : (comment.author?.vorname
          ? comment.author.vorname
          : (comment.author?.nachname
            ? comment.author.nachname
            : 'Unbekannt'))));
    
  // Get initials - prioritize company, then user initials
  // For company users viewing user profiles: only use vorname initial if nachname is not available
  const initials = isCompanyComment && comment.company?.name
    ? comment.company.name.slice(0, 2).toUpperCase()
    : (isCompanyUser && comment.author_type === 'user'
      ? (comment.author?.vorname && comment.author?.nachname
        ? `${comment.author.vorname[0] || ''}${comment.author.nachname[0] || ''}`.toUpperCase()
        : (comment.author?.vorname
          ? comment.author.vorname[0]?.toUpperCase() || 'U'
          : 'U'))
      : (comment.author?.vorname && comment.author?.nachname
        ? `${comment.author.vorname[0] || ''}${comment.author.nachname[0] || ''}`.toUpperCase()
        : (comment.author?.vorname
          ? comment.author.vorname[0]?.toUpperCase() || 'U'
          : (comment.author?.nachname
            ? comment.author.nachname[0]?.toUpperCase() || 'U'
            : 'U'))));

  // Comment author headline/subtitle
  let commentHeadline = '';
  if (isCompanyComment && comment.company) {
    // Company comment: show industry and location
    const parts = [];
    if (comment.company.industry) parts.push(comment.company.industry);
    if (comment.company.main_location) parts.push(comment.company.main_location);
    commentHeadline = parts.join(' • ') || '';
  } else if (comment.author) {
    // User comment: show headline like LinkedIn
    const employer = comment.author.employer_free || comment.author.ausbildungsbetrieb || comment.author.company_name || null;
    if (comment.author.headline) {
      commentHeadline = employer ? `${comment.author.headline} @ ${employer}` : comment.author.headline;
    } else if (comment.author.aktueller_beruf) {
      commentHeadline = employer ? `${comment.author.aktueller_beruf} @ ${employer}` : comment.author.aktueller_beruf;
    } else if (employer) {
      commentHeadline = `@ ${employer}`;
    }
  }

  const hasReplies = comment.replies && comment.replies.length > 0;
  const replyCount = comment.replies?.length || 0;

  return (
    <div className={`${depth > 0 ? 'ml-6 sm:ml-10' : ''}`}>
      <div className="flex items-start gap-2">
        <Avatar 
          className={profileRoute ? "h-7 w-7 sm:h-8 sm:w-8 cursor-pointer flex-shrink-0" : "h-7 w-7 sm:h-8 sm:w-8 cursor-default flex-shrink-0"} 
          onClick={() => {
            if (profileRoute) {
              navigate(profileRoute);
            }
          }}
        >
          <AvatarImage 
            src={isCompanyComment 
              ? (comment.company?.logo_url ?? undefined) 
              : (comment.author?.avatar_url ?? undefined)
            } 
            alt={name}
          />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="bg-muted/40 border rounded-lg p-2 sm:p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <button 
                  className={`text-xs font-semibold block truncate ${profileRoute ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
                  onClick={() => {
                    if (profileRoute) {
                      navigate(profileRoute);
                    }
                  }}
                  disabled={!profileRoute}
                >
                  {name}
                </button>
                {commentHeadline && (
                  <p className="text-[11px] text-muted-foreground truncate">{commentHeadline}</p>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: de })}
              </span>
            </div>
            
            <div className="text-sm whitespace-pre-wrap break-words">{comment.content}</div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-1 ml-1 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('Comment like clicked:', { commentId: comment.id, currentLiked: liked, currentCount: likeCount });
                toggleLike();
              }}
              disabled={isToggling}
              className={`h-6 text-[11px] px-2 ${liked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
            >
              <Heart className={`h-3 w-3 mr-1 ${liked ? 'fill-current' : ''}`} />
              {likeCount > 0 ? `Gefällt mir (${likeCount})` : 'Gefällt mir'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
              onClick={() => onReply(comment.id, name)}
            >
              Antworten
            </Button>
            
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-2 text-primary hover:text-primary/80"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? `Antworten ausblenden (${replyCount})` : `${replyCount} ${replyCount === 1 ? 'Antwort' : 'Antworten'} anzeigen`}
              </Button>
            )}
          </div>
          
          {/* Nested Replies */}
          {showReplies && hasReplies && (
            <div className="mt-3 space-y-3">
              {comment.replies!.map(reply => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  onReply={onReply}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
