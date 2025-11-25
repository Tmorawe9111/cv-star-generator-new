
import React, { useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, Send, FileText, Download, Pencil, Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { usePostLikes, usePostComments, usePostReposts, useCommentLikes } from '@/hooks/usePostInteractions';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import QuickMessageDialog from '@/components/community/QuickMessageDialog';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import CommentItem from './CommentItem';
import { supabase } from '@/integrations/supabase/client';
import { capitalizeFirst } from '@/lib/utils';
import { normalizeImageUrl } from '@/lib/image-utils';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url?: string;
    media?: Array<{ url: string; type: string }>;
    documents?: Array<{ url: string; name: string; type: string }>;
    created_at: string;
    user_id: string;
    author_type?: 'user' | 'company';
    author_id?: string;
    company_id?: string | null;
    recent_interaction?: string;
    like_count?: number;
    comment_count?: number;
    share_count?: number;
    post_type?: string;
    job_id?: string | null;
    applies_enabled?: boolean | null;
    cta_label?: string | null;
    cta_url?: string | null;
    promotion_theme?: string | null;
    author?: {
      id: string;
      vorname?: string;
      nachname?: string;
      avatar_url?: string;
      ausbildungsberuf?: string;
      schule?: string;
      ausbildungsbetrieb?: string;
      aktueller_beruf?: string;
      status?: string;
      employment_status?: string;
      headline?: string;
      company_name?: string;
    } | null;
    company?: {
      id: string;
      name: string;
      logo_url?: string;
      description?: string;
      main_location?: string | null;
      industry?: string | null;
    } | null;
    job?: {
      id: string;
      title: string;
      city?: string | null;
      employment_type?: string | null;
    } | null;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || '');
  const [expanded, setExpanded] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const { user } = useAuth();
  const { company } = useCompany();
  const { toast } = useToast();
  const navigate = useNavigate();
  const commentInputRef = useRef<HTMLInputElement>(null);
  
  // Check if current user is a company user
  const isCompanyUser = !!company?.id;

  const { count: likeCount, liked, isLoading: likesLoading, toggleLike, isToggling } = usePostLikes(post.id);
  const { comments, commentsCount, isLoading: commentsLoading, addComment, isAdding } = usePostComments(post.id);
  const { count: shareCount, hasReposted, repost, isReposting } = usePostReposts(post.id);

  const isJobPost = post.post_type === 'job';
  const jobDetails = post.job || null;
  const ctaLabel = post.cta_label || 'Jetzt informieren';
  const ctaUrl = post.cta_url || (jobDetails ? `/jobs/${jobDetails.id}` : null);
  const hasContent = (post.content || '').trim().length > 0;

const getDisplayName = () => {
  if (post.author_type === 'company' && post.company?.name) {
    return post.company.name;
  }
  if (post.author?.vorname && post.author?.nachname) {
    return `${post.author.vorname} ${post.author.nachname}`;
  }
  return 'Unbekannter Nutzer';
};

const getInitials = () => {
  if (post.author_type === 'company' && post.company?.name) {
    return post.company.name.slice(0, 2).toUpperCase();
  }
  if (post.author?.vorname && post.author?.nachname) {
    return `${post.author.vorname[0]}${post.author.nachname[0]}`;
  }
  return 'U';
};

const authorSubtitle = useMemo(() => {
  if (post.author_type === 'company') {
    const company = post.company;
    if (!company) return '';
    const parts = [];
    if (company.industry) parts.push(company.industry);
    if (company.main_location) parts.push(company.main_location);
    return parts.join(' • ') || '';
  }
  const a = post.author as any;
  if (!a) return '';
  
  // Priorität 1: Headline aus Einstellungen (Berufsbezeichnung / Headline)
  // Priorität 2: Arbeitgeber aus Einstellungen (employer_free)
  // Format: "Headline @ Arbeitgeber" wie bei LinkedIn
  
  // Arbeitgeber ermitteln (Priorität: employer_free > ausbildungsbetrieb > company_name)
  const employer = a.employer_free || a.ausbildungsbetrieb || a.company_name || null;
  
  // 1. Headline vorhanden
  if (a.headline) {
    if (employer) {
      return `${a.headline} @ ${employer}`;
    }
    return a.headline;
  }
  
  // 2. Fallback: Aktueller Beruf
  if (a.aktueller_beruf) {
    if (employer) {
      return `${a.aktueller_beruf} @ ${employer}`;
    }
    return a.aktueller_beruf;
  }
  
  // 3. Fallback: Ausbildungsberuf
  if (a.ausbildungsberuf) {
    if (employer) {
      return `${a.ausbildungsberuf} @ ${employer}`;
    }
    return a.ausbildungsberuf;
  }
  
  // 4. Nur Arbeitgeber
  if (employer) {
    return `@ ${employer}`;
  }
  
  return '';
}, [post.author, post.author_type]);

  const truncated = useMemo(() => {
    const maxLen = 240;
    const content = post.content || '';
    if (expanded) return content;
    if (content.length <= maxLen) return content;
    return content.slice(0, maxLen) + '…';
  }, [post.content, expanded]);

  const isLong = (post.content || '').length > 240;

  const handleLike = () => toggleLike();

  const handleComment = () => {
    const text = newComment.trim();
    if (!text) return;
    
    console.log('Adding comment with replyTo:', replyTo);
    
    // Pass parent_comment_id if replying
    addComment(text, replyTo?.id || null);
    setNewComment('');
    setReplyTo(null);
  };

  const handleShareCommunity = async () => {
    if (hasReposted) {
      toast({ title: 'Schon geteilt', description: 'Du hast diesen Beitrag bereits geteilt.' });
      return;
    }
    repost();
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from('posts')
      .update({ content: capitalizeFirst(editedContent.trim()) })
      .eq('id', post.id)
      .eq('user_id', user?.id);

    if (error) {
      toast({
        title: "Fehler",
        description: "Der Beitrag konnte nicht gespeichert werden",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Gespeichert",
      description: "Dein Beitrag wurde aktualisiert"
    });
    setIsEditing(false);
    window.location.reload();
  };

  const handleCancelEdit = () => {
    setEditedContent(post.content || '');
    setIsEditing(false);
  };

  const handleOpenComments = () => {
    setShowComments(true);
    setTimeout(() => commentInputRef.current?.focus(), 0);
  };

  // Determine profile route based on author type and current user type
  const profileRoute = useMemo(() => {
    // If current user is a company user, they should NEVER see user profiles
    if (isCompanyUser) {
      // If it's the company's own post (by company_id match or author match), go to own company profile with posts tab
      if (post.company_id === company?.id || (post.author_type === 'company' && post.company?.id === company?.id)) {
        return `/company/profile?tab=posts`;
      }
      // If post is from another company, go to that company's public profile
      if (post.author_type === 'company' && post.company?.id) {
        return `/companies/${post.company.id}`;
      }
      // Company users CAN click on user profiles (but see restricted view)
      if (post.author_type === 'user' && (post.author?.id || post.user_id)) {
        return `/u/${post.author?.id || post.user_id}`;
      }
      return null;
    }
    
    // Regular user logic
    if (post.author_type === 'company' && post.company?.id) {
      return `/companies/${post.company.id}`;
    }
    
    // User's own profile
    if (user?.id && (post.author?.id === user.id || post.user_id === user.id)) {
      return '/profile';
    }
    
    // Other user's profile
    return `/u/${post.author?.id || post.user_id}`;
  }, [post.author_type, post.company?.id, post.company_id, post.author?.id, post.user_id, isCompanyUser, company?.id, user?.id]);

  const postLink = `${window.location.origin}/marketplace#post-${post.id}`;

  return (
    <Card id={`post-${post.id}`} className="p-0 w-full overflow-x-hidden rounded-none md:rounded-lg border-0 md:border">
      {post.recent_interaction && (
        <div className="px-3 sm:px-4 md:px-3 lg:px-4 py-2 text-xs text-muted-foreground border-b">
          {post.recent_interaction}
        </div>
      )}

      <div className="px-3 py-2 sm:px-4 md:px-3 md:py-3 lg:px-4 lg:py-4 space-y-2 sm:space-y-3">
        {/* Post Header */}
        <div className="flex items-start gap-2 sm:gap-3">
          <div 
            className={profileRoute ? "cursor-pointer" : "cursor-default"} 
            onClick={() => profileRoute && navigate(profileRoute)}
          >
<Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-background shadow-lg bg-background">
  <AvatarImage 
    src={post.author_type === 'company' ? (post.company?.logo_url || undefined) : (post.author?.avatar_url || undefined)} 
    className="object-cover" 
  />
  <AvatarFallback className="bg-primary/10 text-foreground font-semibold">{getInitials()}</AvatarFallback>
</Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
              <button 
                className={`font-semibold text-sm text-left truncate ${profileRoute ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
                onClick={() => profileRoute && navigate(profileRoute)}
                disabled={!profileRoute}
              >
                {getDisplayName()}
              </button>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: de })}
              </span>
            </div>
            {authorSubtitle && (
              <p className="text-xs text-muted-foreground truncate">{authorSubtitle}</p>
            )}
          </div>
          {post.author_type === 'user' && post.user_id === user?.id && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Post Content */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[100px]"
              placeholder="Beitrag bearbeiten..."
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} size="sm">
                Speichern
              </Button>
              <Button onClick={handleCancelEdit} size="sm" variant="outline">
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {isJobPost && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wide">
                  <Megaphone className="h-4 w-4" /> Job Spotlight
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    {jobDetails?.title || 'Stellenangebot'}
                  </h3>
                  {jobDetails && (
                    <p className="text-xs text-muted-foreground">
                      {[jobDetails.city, jobDetails.employment_type].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  {ctaUrl ? (
                    <Button asChild size="sm" className="rounded-full">
                      <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
                        {ctaLabel}
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" className="rounded-full" disabled>
                      {ctaLabel}
                    </Button>
                  )}
                </div>
              </div>
            )}
            {hasContent && (
              <p className="text-sm leading-relaxed break-words">
                {truncated}
                {!expanded && isLong && (
                  <button className="ml-1 text-primary hover:underline text-xs" onClick={() => setExpanded(true)}>
                    Mehr anzeigen
                  </button>
                )}
              </p>
            )}
          </div>
        )}

        {!isEditing && (
          <>
            {/* Legacy single image - Fixed size, click to zoom */}
            {post.image_url && !post.media?.length && (
              <div className="-mx-3 sm:-mx-4 md:mx-0">
                <div className="w-full h-64 overflow-hidden rounded-none md:rounded-lg">
                  <img
                    src={normalizeImageUrl(post.image_url) || post.image_url}
                    alt="Post Bild"
                    className="w-full h-full object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
                    onClick={() => setImageOpen(true)}
                    loading="lazy"
                    onError={(e) => {
                      console.error('Image load error:', post.image_url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <Dialog open={imageOpen} onOpenChange={setImageOpen}>
                  <DialogContent className="max-w-4xl">
                    <img 
                      src={normalizeImageUrl(post.image_url) || post.image_url} 
                      alt="Bild groß" 
                      className="w-full h-auto rounded"
                      onError={(e) => {
                        console.error('Image load error in dialog:', post.image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}

          {/* Multiple media images - Fixed size grid, click to zoom */}
          {post.media && post.media.length > 0 && (
            <div className={`-mx-3 sm:-mx-4 md:mx-0 grid gap-2 ${
              post.media.length === 1 ? 'grid-cols-1' :
              post.media.length === 2 ? 'grid-cols-2' :
              post.media.length === 3 ? 'grid-cols-3' :
              'grid-cols-2'
            }`}>
              {post.media.slice(0, 4).map((item, index) => (
                <div key={index} className="relative w-full h-64 overflow-hidden rounded-none md:rounded-lg">
                  <img
                    src={normalizeImageUrl(item.url) || item.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
                    onClick={() => setImageOpen(true)}
                    loading="lazy"
                    onError={(e) => {
                      console.error('Media image load error:', item.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {index === 3 && post.media!.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg cursor-pointer" onClick={() => setImageOpen(true)}>
                      <span className="text-white text-2xl font-semibold">+{post.media!.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Documents - No scrolling, just list */}
          {post.documents && post.documents.length > 0 && (
            <div className="space-y-2">
              {post.documents.map((doc, index) => (
                <a
                  key={index}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">Dokument herunterladen</p>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
          </>
        )}

        {/* Counts row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {likesLoading ? '…' : likeCount}
          </span>
          <span className="cursor-pointer" onClick={handleOpenComments}>
            {commentsLoading ? '…' : `${commentsCount} Kommentare`}
          </span>
        </div>

        {/* Post Actions */}
        <div className="flex flex-wrap items-center justify-between gap-1 pt-2 border-t">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`min-h-[44px] min-w-[44px] h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground hover:text-red-500 ${liked ? 'text-red-500' : ''}`}
              disabled={isToggling}
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">Gefällt mir</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="min-h-[44px] min-w-[44px] h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground"
            >
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Kommentieren</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareCommunity}
              className="min-h-[44px] min-w-[44px] h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground"
              disabled={isReposting}
            >
              <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">{hasReposted ? 'Geteilt' : 'Teilen'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSendOpen(true)}
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground hidden sm:flex"
            >
              <Send className="h-4 w-4 mr-1" />
              Direkt senden
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-2 sm:space-y-3 pt-3 border-t">
            <div className="flex gap-2">
              <Input
                ref={commentInputRef as any}
                placeholder={replyTo ? `Antwort an ${replyTo.name}…` : 'Schreibe einen Kommentar...'}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 min-w-0 h-9"
              />
              <Button size="sm" className="h-9 px-3" onClick={handleComment} disabled={!newComment.trim() || isAdding}>
                Senden
              </Button>
            </div>

            {commentsLoading ? (
              <p className="text-xs text-muted-foreground">Kommentare werden geladen…</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sei der Erste, der kommentiert.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => {
                  const name = c.author?.vorname && c.author?.nachname
                    ? `${c.author.vorname} ${c.author.nachname}`
                    : 'Unbekannt';
                  const mention = `@${name.split(' ')[0]}`;
                  
                  return (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      onReply={(commentId, replyName) => {
                        setReplyTo({ id: commentId, name: replyName });
                        setShowComments(true);
                        setNewComment((prev) => (prev.startsWith(`@${replyName.split(' ')[0]}`) ? prev : `@${replyName.split(' ')[0]} `));
                        setTimeout(() => commentInputRef.current?.focus(), 0);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DM dialog */}
      <QuickMessageDialog open={sendOpen} onOpenChange={setSendOpen} initialContent={`Schau dir diesen Beitrag an: ${postLink}`} />
    </Card>
  );
}
