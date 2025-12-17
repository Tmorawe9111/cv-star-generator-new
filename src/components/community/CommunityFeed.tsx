import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PostCard from './PostCard';
import NewPostsNotification from './NewPostsNotification';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LogoSpinner } from '@/components/shared/LoadingSkeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type PostWithAuthor = {
  id: string;
  content: string;
  image_url?: string;
  media?: Array<{ url: string; type: string }>;
  documents?: Array<{ url: string; name: string; type: string }>;
  created_at: string;
  user_id: string;
  author_type?: "user" | "company";
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
  author?: any;
  company?: any;
  job?: {
    id: string;
    title: string;
    city?: string | null;
    employment_type?: string | null;
  } | null;
  [key: string]: any;
};

const PAGE_SIZE = 20;

type FeedSortOption = "relevant" | "newest";

interface CommunityFeedProps {
  feedHeadHeight?: number; // Höhe der Feed-Header-Sektion für Sticky-Position
}

export default function CommunityFeed({ feedHeadHeight = 0 }: CommunityFeedProps) {
  const { user } = useAuth();
  const { company } = useCompany();
  const isCompanyUser = !!company?.id;
  const queryClient = useQueryClient();
  const viewerId = user?.id || null;
  const [sort, setSort] = useState<FeedSortOption>((localStorage.getItem('feed_sort') as FeedSortOption) || 'relevant');
  const isMobile = useIsMobile();
  
  // Pull-to-refresh state
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startX = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debug: Log auth state
  console.log('[feed] Auth state:', { user: !!user, userId: user?.id, viewerId });

  useEffect(() => {
    const handler = (e: any) => setSort(e.detail as FeedSortOption);
    window.addEventListener('feed-sort-changed', handler);
    return () => window.removeEventListener('feed-sort-changed', handler);
  }, []);

  const feedQuery = useInfiniteQuery({
    queryKey: ['home-feed', viewerId, sort],
    enabled: true, // Always enabled to load posts
    staleTime: 1 * 60 * 1000, // 1 Minute - Feed aktualisiert sich häufiger
    gcTime: 3 * 60 * 1000, // 3 Minuten (formerly cacheTime in React Query v4)
    initialPageParam: { after_published: null as string | null, after_id: null as string | null },
    queryFn: async ({ pageParam }) => {
      console.log('[feed] fetching page', pageParam, sort);

      // Use view with engagement scores
      let query = supabase
        .from('posts_with_engagement')
        .select('*, image_url, media, documents')
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
      if (pageParam?.after_published) {
        query = query.lt('created_at', pageParam.after_published);
      }

      const { data: posts, error } = await query;

      if (error) {
        console.error('[feed] get_feed error', error);
        throw error;
      }

      console.log('[feed] raw posts from DB:', posts?.length, posts);
      
      // Cast to any to fix TypeScript errors with community_posts table
      const rawPosts = posts as any[];
      
      // Debug: Check if we have any posts at all
      if (!rawPosts || rawPosts.length === 0) {
        console.warn('[feed] No posts found in database!');
        
        // Try to get all posts without filters to debug
        const { data: allPosts, error: allError } = await supabase
          .from('posts')
          .select('id, created_at, content')
          .limit(5);
        
        console.log('[feed] All posts (any status):', allPosts?.length, allPosts);
        if (allError) {
          console.error('[feed] Error fetching all posts:', allError);
        }
      }

      // Transform posts data to match expected structure (map posts to expected format)
      const transformedPosts: PostWithAuthor[] =
        rawPosts?.map((post: any) => ({
          id: post.id,
          content: post.content ?? '',
          image_url: post.image_url ?? null,
          media: Array.isArray(post.media) ? post.media : [],
          documents: Array.isArray(post.documents) ? post.documents : [],
          user_id: post.user_id,
          author_type: post.author_type === 'company' ? 'company' : 'user',
          author_id: post.author_id ?? post.user_id,
          company_id: post.company_id ?? null,
          like_count: post.like_count ?? post.likes_count ?? 0,
          comment_count: post.comment_count ?? post.comments_count ?? 0,
          share_count: post.share_count ?? post.shares_count ?? 0,
          created_at: post.created_at,
          updated_at: post.updated_at,
          published_at: post.created_at,
          post_type: post.post_type ?? 'text',
          job_id: post.job_id ?? null,
          applies_enabled: post.applies_enabled ?? false,
          cta_label: post.cta_label ?? null,
          cta_url: post.cta_url ?? null,
          promotion_theme: post.promotion_theme ?? null,
          author: post.author || null,
          company: post.company || null,
          job: post.job || null,
        })) || [];

      console.log('[feed] transformed posts:', transformedPosts.length, transformedPosts);

      // Load missing user profiles OR filter existing author data for company users
      const postsNeedingAuthorInfo = transformedPosts.filter(
        (post) => post.author_type === 'user' && (!post.author || (isCompanyUser && post.author))
      );
      if (postsNeedingAuthorInfo.length > 0) {
        const userIds = [...new Set(postsNeedingAuthorInfo.map((p) => p.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          // For company users: always reload profiles to ensure nachname filtering works
          // For regular users: only load if author data is missing
          const shouldReload = isCompanyUser || postsNeedingAuthorInfo.some(p => !p.author);
          
          let profiles: any[] = [];
          if (shouldReload) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select(
                'id, vorname, nachname, avatar_url, headline, employer_free, aktueller_beruf, ausbildungsberuf, ausbildungsbetrieb, company_name'
              )
              .in('id', userIds);

            if (profileError) {
              console.error('[feed] profile fetch error', profileError);
              console.error('[feed] profile fetch error details:', {
                code: profileError.code,
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint
              });
            } else {
              profiles = profileData || [];
              console.log('[feed] loaded profiles:', profiles.length, 'for company user:', isCompanyUser, 'company:', company?.id);
              console.log('[feed] profile data sample:', profiles[0]);
            }
          } else {
            // Use existing author data
            profiles = postsNeedingAuthorInfo
              .filter(p => p.author)
              .map(p => ({
                id: p.user_id,
                vorname: p.author?.vorname,
                nachname: p.author?.nachname,
                avatar_url: p.author?.avatar_url,
                headline: p.author?.headline,
                employer_free: p.author?.employer_free,
                aktueller_beruf: p.author?.aktueller_beruf,
                ausbildungsberuf: p.author?.ausbildungsberuf,
                ausbildungsbetrieb: p.author?.ausbildungsbetrieb,
                company_name: p.author?.company_name,
              }));
          }

          // For company users: check which profiles are unlocked and hide nachname if not unlocked
          let unlockedProfileIds = new Set<string>();
          if (isCompanyUser && company?.id && profiles && profiles.length > 0) {
            const { data: unlockedCandidates, error: unlockError } = await supabase
              .from('company_candidates')
              .select('candidate_id')
              .eq('company_id', company.id)
              .in('candidate_id', userIds)
              .not('unlocked_at', 'is', null);
            
            if (unlockError) {
              console.error('[feed] unlock check error:', unlockError);
            } else {
              console.log('[feed] unlocked candidates:', unlockedCandidates?.length, unlockedCandidates);
              if (unlockedCandidates) {
                unlockedProfileIds = new Set(unlockedCandidates.map(uc => uc.candidate_id));
              }
            }
          }

          const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));

          // Process all posts that need author info
          postsNeedingAuthorInfo.forEach((post) => {
            const author = profileMap.get(post.user_id);
            if (author) {
              // For company users: hide nachname if profile is not unlocked
              const isUnlocked = isCompanyUser ? unlockedProfileIds.has(author.id) : true;
              console.log('[feed] processing author:', {
                userId: post.user_id,
                authorId: author.id,
                vorname: author.vorname,
                nachname: author.nachname,
                isCompanyUser,
                isUnlocked,
                willShowNachname: isUnlocked ? author.nachname : null
              });
              post.author = {
                id: author.id,
                vorname: author.vorname,
                nachname: isUnlocked ? author.nachname : null, // Hide nachname if not unlocked for company users
                avatar_url: author.avatar_url,
                headline: author.headline,
                employer_free: author.employer_free,
                aktueller_beruf: author.aktueller_beruf,
                ausbildungsberuf: author.ausbildungsberuf,
                ausbildungsbetrieb: author.ausbildungsbetrieb,
                company_name: author.company_name,
              };
            } else {
              console.warn('[feed] author not found for user_id:', post.user_id);
            }
          });

          // Also filter nachname for company users on ALL posts (even those that already have author data)
          if (isCompanyUser && company?.id) {
            // Get all user IDs from all posts to check unlock status
            const allUserIds = [...new Set(transformedPosts
              .filter(p => p.author_type === 'user' && p.user_id)
              .map(p => p.user_id)
              .filter(Boolean))];
            
            if (allUserIds.length > 0 && unlockedProfileIds.size === 0) {
              // Reload unlock status for all posts
              const { data: allUnlockedCandidates } = await supabase
                .from('company_candidates')
                .select('candidate_id')
                .eq('company_id', company.id)
                .in('candidate_id', allUserIds)
                .not('unlocked_at', 'is', null);
              
              if (allUnlockedCandidates) {
                unlockedProfileIds = new Set(allUnlockedCandidates.map(uc => uc.candidate_id));
                console.log('[feed] all unlocked candidates for company:', unlockedProfileIds.size, Array.from(unlockedProfileIds));
              }
            }
            
            transformedPosts.forEach((post) => {
              if (post.author_type === 'user' && post.author) {
                // Check if this profile is unlocked
                const isUnlocked = unlockedProfileIds.has(post.author.id);
                if (!isUnlocked && post.author.nachname) {
                  console.log('[feed] hiding nachname for NON-unlocked profile:', {
                    postId: post.id,
                    authorId: post.author.id,
                    vorname: post.author.vorname,
                    nachname: post.author.nachname,
                    isUnlocked
                  });
                  post.author.nachname = null;
                }
              }
            });
          }
        }
      }

      // Load missing company metadata for company posts
      const companyIds = [
        ...new Set(
          transformedPosts
            .filter((post) => post.author_type === 'company' && !post.company && post.company_id)
            .map((post) => post.company_id as string)
        ),
      ];

      if (companyIds.length > 0) {
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, logo_url, main_location, industry, description')
          .in('id', companyIds);

        if (companiesError) {
          console.error('[feed] company fetch error', companiesError);
        }

        const companyMap = new Map((companies || []).map((company) => [company.id, company]));

        transformedPosts.forEach((post) => {
          if (post.author_type === 'company' && !post.company && post.company_id) {
            post.company = companyMap.get(post.company_id) || null;
          }
        });
      }

      // Load job details for spotlight posts
      const jobIds = [
        ...new Set(
          transformedPosts
            .filter((post) => post.job_id)
            .map((post) => post.job_id as string)
        ),
      ];

      if (jobIds.length > 0) {
        const { data: jobRows, error: jobError } = await supabase
          .from('job_posts')
          .select('id, title, city, employment_type')
          .in('id', jobIds);

        if (jobError) {
          console.error('[feed] job fetch error', jobError);
        }

        const jobMap = new Map((jobRows || []).map((job) => [job.id, job]));

        transformedPosts.forEach((post) => {
          if (post.job_id) {
            post.job = jobMap.get(post.job_id) || null;
          }
        });
      }

      return {
        posts: transformedPosts,
        nextPage: rawPosts && rawPosts.length === PAGE_SIZE
          ? {
              after_published: rawPosts[rawPosts.length - 1]?.created_at,
              after_id: rawPosts[rawPosts.length - 1]?.id,
            }
          : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const posts = feedQuery.data?.pages.flatMap((page: { posts: PostWithAuthor[] }) => page.posts) ?? [];
  const postIds = posts.map(post => post.id);

  // Pull-to-refresh handlers (mobile only)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    const target = e.target as unknown as HTMLElement;
    // If touch starts inside a horizontal scroller, never start pull-to-refresh
    if (target?.closest?.('[data-hscroll="true"]')) return;

    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
    }
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    const target = e.target as unknown as HTMLElement;
    // If touch is happening inside a horizontal scroller, let it scroll horizontally
    if (target?.closest?.('[data-hscroll="true"]')) return;

    if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;

      const dy = currentY - startY.current;
      const dx = currentX - startX.current;

      // If user is swiping horizontally, do not trigger pull-to-refresh
      if (Math.abs(dx) > Math.abs(dy) + 6) return;

      if (dy > 0 && dy < 150) {
        // small deadzone to reduce accidental pulls while swiping
        if (dy < 6) return;
        setPullDistance(dy);
      }
    }
  }, [isMobile, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isMobile) return;
    if (pullDistance > 80 && !isRefreshing) {
      setIsRefreshing(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }
      
      // Refresh feed query
      await queryClient.invalidateQueries({ queryKey: ['home-feed', viewerId, sort] });
      await feedQuery.refetch();
      
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        toast({ title: '✨ Feed aktualisiert!' });
      }, 800);
    } else {
      setPullDistance(0);
    }
  }, [isMobile, pullDistance, isRefreshing, queryClient, viewerId, sort, feedQuery]);

  if (feedQuery.isLoading && posts.length === 0) {
    return <LogoSpinner size="lg" text="Posts werden geladen..." />;
  }

  if (feedQuery.isError) {
    const errorMsg = feedQuery.error.message;
    const isForeignKeyError = errorMsg.includes("relationship") || errorMsg.includes("foreign key");
    
    return (
      <Card className="p-6 text-center">
        <p className="font-semibold mb-2 text-destructive">Fehler beim Laden der Beiträge</p>
        {isForeignKeyError ? (
          <p className="text-sm text-muted-foreground">
            Die Datenbankverbindung ist fehlerhaft konfiguriert. 
            Bitte kontaktiere den Administrator.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
        )}
        <Button onClick={() => feedQuery.refetch()} className="mt-4">
          Erneut versuchen
        </Button>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Noch keine Beiträge vorhanden</p>
        <p className="text-sm text-muted-foreground mt-1">
          Sei der Erste und teile etwas mit der Community!
        </p>
      </Card>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="space-y-1 md:space-y-4 w-full max-w-full overflow-x-hidden -mx-0 md:mx-0"
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* Pull-to-refresh indicator (mobile only) */}
      {isMobile && (
        <div 
          className="flex items-center justify-center overflow-hidden transition-all duration-200"
          style={{ height: isRefreshing ? 60 : Math.min(pullDistance, 80) }}
        >
          <div className={cn(
            "flex items-center gap-2 text-gray-500 text-sm",
            isRefreshing && "animate-pulse"
          )}>
            <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? 'Aktualisiere...' : pullDistance > 80 ? 'Loslassen' : 'Runterziehen'}</span>
          </div>
        </div>
      )}

      <NewPostsNotification 
        onRefresh={() => feedQuery.refetch()} 
        currentPostIds={postIds}
        feedHeadHeight={feedHeadHeight}
      />
      
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {feedQuery.hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            onClick={() => feedQuery.fetchNextPage()}
            disabled={feedQuery.isFetchingNextPage}
            variant="outline"
          >
            {feedQuery.isFetchingNextPage ? (
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
    </div>
  );
}