import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PostCard from './PostCard';
import NewPostsNotification from './NewPostsNotification';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { LogoSpinner } from '@/components/shared/LoadingSkeleton';

type PostWithAuthor = any;

const PAGE_SIZE = 20;

type FeedSortOption = "relevant" | "newest";

interface CommunityFeedProps {
  feedHeadHeight?: number;
}

export default function CommunityFeed({ feedHeadHeight = 0 }: CommunityFeedProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const viewerId = user?.id || null;
  const [sort, setSort] = useState<FeedSortOption>((localStorage.getItem('feed_sort') as FeedSortOption) || 'relevant');

  console.log('[feed] Auth state:', { user: !!user, userId: user?.id, viewerId });

  useEffect(() => {
    const handler = (e: any) => setSort(e.detail as FeedSortOption);
    window.addEventListener('feed-sort-changed', handler);
    return () => window.removeEventListener('feed-sort-changed', handler);
  }, []);

  const feedQuery = useInfiniteQuery({
    queryKey: ['clean-feed', viewerId, sort],
    enabled: true,
    initialPageParam: { after_created: null as string | null, after_id: null as string | null },
    queryFn: async ({ pageParam }) => {
      console.log('[feed] Fetching clean posts page', pageParam, sort);

      // Use view with engagement scores
      let query = supabase
        .from('posts_with_engagement')
        .select('*')
        .limit(PAGE_SIZE);

      // Apply sorting based on user selection
      if (sort === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        // Sort by relevance (engagement score), then by date for tie-breaker
        query = query
          .order('engagement_score', { ascending: false })
          .order('created_at', { ascending: false });
      }

      // Apply pagination
      if (pageParam?.after_created) {
        query = query.lt('created_at', pageParam.after_created);
      }

      const { data: posts, error } = await query;

      if (error) {
        console.error('[feed] Error fetching posts:', error);
        throw error;
      }

      console.log('[feed] Raw posts from DB:', posts?.length, posts);

      // Load author profiles separately
      const userIds = [...new Set(posts?.map(p => p.user_id).filter(Boolean))] as string[];
      let authors: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, vorname, nachname, avatar_url, headline, employer_free, aktueller_beruf, ausbildungsberuf, ausbildungsbetrieb, company_name, status, branche, ort, profile_slug')
          .in('id', userIds);
        authors = profilesData || [];
        console.log('[feed] Loaded authors:', authors.length, 'for', userIds.length, 'user IDs');
        
        // CRITICAL: Filter out posts from deleted users (users without profiles)
        const validUserIds = new Set(authors.map(a => a.id));
        const originalPostCount = posts?.length || 0;
        posts = posts?.filter(p => {
          if (!p.user_id) return false; // No user_id = invalid
          if (!validUserIds.has(p.user_id)) {
            console.warn('[feed] Filtering post from deleted user:', p.id, p.user_id);
            return false;
          }
          return true;
        }) || [];
        console.log('[feed] Filtered posts:', originalPostCount, '->', posts.length, '(removed', originalPostCount - posts.length, 'posts from deleted users)');
      } else {
        // No user IDs means no valid posts
        posts = [];
      }

      // Get counts for all posts
      const postIds = posts?.map(p => p.id) || [];
      const { data: likeCounts } = await supabase.from('post_likes').select('post_id').in('post_id', postIds);
      const { data: commentCounts } = await supabase.from('post_comments').select('post_id').in('post_id', postIds);

      const likeMap = (likeCounts || []).reduce((acc: Record<string, number>, { post_id }: any) => {
        acc[post_id] = (acc[post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commentMap = (commentCounts || []).reduce((acc: Record<string, number>, { post_id }: any) => {
        acc[post_id] = (acc[post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Transform posts to match PostCard interface
      // CRITICAL: Only include posts with valid authors (filter out deleted users)
      const transformedPosts = posts
        ?.filter(post => {
          if (!post.user_id) return false;
          const author = authors.find(a => a.id === post.user_id);
          if (!author) {
            console.warn('[feed] Filtering post from deleted user:', post.id, post.user_id);
            return false;
          }
          return true;
        })
        .map(post => {
          const author = authors.find(a => a.id === post.user_id);
          
          return {
          id: post.id,
          content: post.content || '',
          body_md: post.content || '',
          image_url: post.image_url || null,
          media: (post.media ? (post.media as Array<{ url: string; type: string }>) : (post.image_url ? [{ url: post.image_url, type: 'image' }] : [])),
          documents: (post.documents ? (post.documents as Array<{ url: string; name: string; type: string }>) : []),
          visibility: 'public',
          user_id: post.user_id,
          actor_user_id: post.user_id,
          author_type: 'user' as const,
          author_id: post.user_id,
          company_id: null,
          actor_company_id: null,
          like_count: likeMap[post.id] || 0,
          likes_count: likeMap[post.id] || 0,
          comment_count: commentMap[post.id] || 0,
          comments_count: commentMap[post.id] || 0,
          share_count: 0,
          shares_count: 0,
          created_at: post.created_at,
          updated_at: post.updated_at,
          published_at: post.created_at,
          author: author ? {
            id: author.id,
            vorname: author.vorname || null,
            nachname: author.nachname || null,
            avatar_url: author.avatar_url || null,
            headline: author.headline || null,
            employer_free: author.employer_free || null,
            company_name: author.company_name || null,
            status: author.status || null,
            branche: author.branche || null,
            ort: author.ort || null,
            ausbildungsberuf: author.ausbildungsberuf || null,
            ausbildungsbetrieb: author.ausbildungsbetrieb || null,
            aktueller_beruf: author.aktueller_beruf || null,
            type: 'user',
          } : {
            id: post.user_id,
            vorname: 'Nutzer',
            nachname: post.user_id?.slice(0, 8) || 'Unbekannt',
            avatar_url: null,
            status: null,
            branche: null,
            ort: null,
            ausbildungsberuf: null,
            ausbildungsbetrieb: null,
            aktueller_beruf: null,
            headline: null,
            type: 'user',
          }
        };
      }) || [];

      console.log('[feed] Transformed posts:', transformedPosts.length, transformedPosts);

      return {
        posts: transformedPosts,
        nextPage: posts && posts.length === PAGE_SIZE
          ? {
              after_created: posts[posts.length - 1].created_at,
              after_id: posts[posts.length - 1].id,
            }
          : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const posts = feedQuery.data?.pages.flatMap(page => page.posts) ?? [];
  const isLoading = feedQuery.isLoading;
  const isFetchingNextPage = feedQuery.isFetchingNextPage;
  const hasNextPage = feedQuery.hasNextPage;

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      feedQuery.fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LogoSpinner />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <h3 className="text-lg font-medium">Noch keine Beiträge</h3>
          <p className="text-sm">Sei der Erste, der etwas postet!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Posts */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isFetchingNextPage}
            className="w-full max-w-md"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Lade mehr...
              </>
            ) : (
              'Mehr laden'
            )}
          </Button>
        </div>
      )}

      {/* New Posts Notification */}
      <NewPostsNotification />
    </div>
  );
}
