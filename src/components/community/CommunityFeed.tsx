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
import { getFeedSubtitle } from '@/lib/profile-utils';

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
      console.log('[feed] fetching page', pageParam, sort, 'viewerId:', viewerId);

      let rawPosts: any[] = [];

      // Für eingeloggte User: Verwende get_feed_by_branch (mit Branch-Filter)
      // Für nicht-eingeloggte User: Zeige alle Posts
      if (viewerId) {
        console.log('[feed] Using get_feed_by_branch for logged-in user:', viewerId);
        
        try {
          const { data: posts, error: rpcError } = await (supabase as any)
            .rpc('get_feed_by_branch', {
              p_viewer_id: viewerId,
              p_limit: PAGE_SIZE,
              p_after_published: pageParam?.after_published || null,
              p_after_id: pageParam?.after_id || null,
              p_sort_by: sort === 'newest' ? 'newest' : 'relevant'
            });

          if (rpcError) {
            console.error('[feed] get_feed_by_branch error:', rpcError);
            throw rpcError;
          }

          console.log('[feed] raw posts from get_feed_by_branch:', Array.isArray(posts) ? posts.length : 0);
          if (Array.isArray(posts) && posts.length > 0) {
            console.log('[feed] sample post:', {
              id: posts[0].id,
              user_id: posts[0].user_id,
              author_branche: posts[0].author_branche,
              isOwnPost: posts[0].user_id === viewerId
            });
          }
          rawPosts = Array.isArray(posts) ? posts : [];
        } catch (error) {
          console.error('[feed] Error in get_feed_by_branch, using fallback:', error);
          // Fallback: Verwende View direkt (ohne Branch-Filter)
          let query = supabase
            .from('posts_with_engagement')
            .select('*, image_url, media, documents')
            .limit(PAGE_SIZE);

          if (sort === 'newest') {
            query = query.order('created_at', { ascending: false });
          } else {
            query = query
              .order('engagement_score', { ascending: false })
              .order('created_at', { ascending: false });
          }

          if (pageParam?.after_published) {
            query = query.lt('created_at', pageParam.after_published);
          }

          const { data: viewPosts, error: viewError } = await query;
          if (viewError) {
            console.error('[feed] View query error', viewError);
            throw viewError;
          }
          rawPosts = viewPosts as any[] || [];
        }
      } else {
        // Fallback: Use view with engagement scores for non-logged-in users (show all posts)
        console.log('[feed] Using posts_with_engagement view for non-logged-in user');
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
        rawPosts = posts as any[] || [];
      }
      
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
      // CRITICAL: Filter out posts from deleted users (posts without profiles)
      console.log('[feed] transforming', rawPosts?.length || 0, 'raw posts');
      const transformedPosts: PostWithAuthor[] = (rawPosts || [])
          .filter((post: any) => {
            const hasUserId = !!post.user_id;
            if (!hasUserId) {
              console.warn('[feed] post without user_id:', post.id, post);
            }
            return hasUserId;
          }) // Only posts with user_id
          .map((post: any) => {
            console.log('[feed] transforming post:', {
              id: post.id,
              user_id: post.user_id,
              author_type: post.author_type,
              hasAuthor: !!post.author
            });
            return {
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
            };
      });
      
      console.log('[feed] transformed posts count:', transformedPosts.length);
      console.log('[feed] transformed posts user_ids:', transformedPosts.map(p => p.user_id));

      console.log('[feed] transformed posts:', transformedPosts.length, transformedPosts);

      // Load missing user profiles OR filter existing author data for company users
      // WICHTIG: Wenn wir get_feed_by_branch verwenden, haben Posts keine author Daten
      // Also müssen wir für ALLE User-Posts die Author-Daten laden
      // CRITICAL: Wenn viewerId existiert, verwenden wir get_feed_by_branch, also haben ALLE Posts keine author Daten
      const usingRPC = viewerId !== null;
      const postsNeedingAuthorInfo = transformedPosts.filter(
        (post) => {
          if (post.author_type !== 'user') return false;
          // Wenn wir RPC verwenden, haben ALLE Posts keine author Daten
          if (usingRPC) return true;
          // Sonst nur Posts ohne author oder für Company-User
          return !post.author || (isCompanyUser && post.author);
        }
      );
      
      console.log('[feed] using RPC (get_feed_by_branch):', usingRPC);
      console.log('[feed] posts needing author info:', postsNeedingAuthorInfo.length, 'of', transformedPosts.length, 'total posts');
      console.log('[feed] all user IDs from posts:', transformedPosts.filter(p => p.author_type === 'user').map(p => p.user_id));
      
      // CRITICAL: Lade Profile für ALLE User-Posts, nicht nur die, die Author-Info brauchen
      // Das stellt sicher, dass alle Posts Author-Daten haben
      const allUserPosts = transformedPosts.filter(p => p.author_type === 'user' && p.user_id);
      const allUserIds = [...new Set(allUserPosts.map(p => p.user_id).filter(Boolean))];
      
      if (allUserIds.length > 0) {
        console.log('[feed] Loading profiles for ALL user posts:', allUserIds.length, 'unique user IDs');
        // Use allUserIds instead of just postsNeedingAuthorInfo
        const userIds = allUserIds;
        console.log('[feed] unique user IDs to load:', userIds.length, userIds);
        
        // CRITICAL: Always load profiles for all user posts (same as Marketplace)
        // This ensures that avatar_url and headline are always available
        console.log('[feed] Loading profiles for all user posts (always, like Marketplace)...');
        
        // CRITICAL: Use direct query with * (same as UserProfile.tsx - this works!)
        console.log('[feed] Loading profiles via direct query with * (same as UserProfile)...');
        
        // Use direct query with * (same as UserProfile.tsx - this loads all columns including avatar_url and headline!)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        
        let profiles: any[] = [];
        if (profileError) {
          console.error('[feed] Profile fetch error:', profileError);
          // Fallback to RPC function if direct query fails
          console.log('[feed] Falling back to RPC function...');
          const { data: rpcProfileData, error: rpcError } = await (supabase as any)
            .rpc('get_profiles_for_feed', { p_user_ids: userIds });
          
          if (rpcError) {
            console.error('[feed] RPC Profile fetch error (fallback):', rpcError);
            profiles = [];
          } else {
            profiles = (rpcProfileData || []) as any[];
            console.log('[feed] ✅ RPC function (fallback) loaded profiles:', profiles.length, 'for', userIds.length, 'user IDs');
          }
        } else {
          profiles = (profileData || []) as any[];
          console.log('[feed] ✅ Direct query loaded profiles:', profiles.length, 'for', userIds.length, 'user IDs');
          
          // CRITICAL: Log raw response to see what's actually returned
          console.log('[feed] 🔍 RAW PROFILE DATA:', JSON.stringify(profileData?.slice(0, 2), null, 2));
          
          // CRITICAL: Verify that all required fields are present
          if (profiles.length > 0) {
            const firstProfile = profiles[0];
            console.log('[feed] 🔍 Profile sample (first profile from direct query):', {
              id: firstProfile.id,
              vorname: firstProfile.vorname,
              nachname: firstProfile.nachname,
              avatar_url: firstProfile.avatar_url ? `SET: ${firstProfile.avatar_url.substring(0, 50)}...` : 'NULL',
              headline: firstProfile.headline ? `SET: ${firstProfile.headline}` : 'NULL',
              // CRITICAL: Log raw values to see what's actually loaded from database
              rawAvatarUrl: firstProfile.avatar_url,
              rawHeadline: firstProfile.headline,
              rawProfileObject: JSON.stringify(firstProfile, null, 2)
            });
            
            // CRITICAL: Check all profiles for avatar_url
            const profilesWithAvatar = profiles.filter((p: any) => p.avatar_url);
            const profilesWithoutAvatar = profiles.filter((p: any) => !p.avatar_url);
            console.log('[feed] 📊 Profile avatar_url stats:', {
              total: profiles.length,
              withAvatar: profilesWithAvatar.length,
              withoutAvatar: profilesWithoutAvatar.length,
              withoutAvatarIds: profilesWithoutAvatar.map((p: any) => p.id)
            });
          } else {
            console.warn('[feed] ⚠️ Direct query returned NO profiles!', {
              requestedUserIds: userIds,
              profileData: profileData
            });
          }
        }
            
            console.log('[feed] Final profiles loaded:', profiles.length, 'for', userIds.length, 'requested');
            console.log('[feed] user IDs requested:', userIds);
            console.log('[feed] profiles loaded with details:', profiles.map((p: any) => ({ 
              id: p.id, 
              vorname: p.vorname, 
              nachname: p.nachname,
              avatar_url: p.avatar_url ? `SET: ${p.avatar_url.substring(0, 50)}...` : 'NULL',
              headline: p.headline ? `SET: ${p.headline}` : 'NULL',
              aktueller_beruf: p.aktueller_beruf ? 'SET' : 'NULL',
              ausbildungsberuf: p.ausbildungsberuf ? 'SET' : 'NULL',
              ausbildungsbetrieb: p.ausbildungsbetrieb ? 'SET' : 'NULL',
              employer_free: p.employer_free ? 'SET' : 'NULL'
            })));
            
            // CRITICAL: Log raw profile data to verify what's actually loaded
            if (profiles.length > 0) {
              console.log('[feed] 🔍 RAW PROFILE DATA (first profile):', {
                id: profiles[0].id,
                vorname: profiles[0].vorname,
                nachname: profiles[0].nachname,
                avatar_url: profiles[0].avatar_url,
                headline: profiles[0].headline,
                aktueller_beruf: profiles[0].aktueller_beruf,
                ausbildungsberuf: profiles[0].ausbildungsberuf,
                ausbildungsbetrieb: profiles[0].ausbildungsbetrieb,
                employer_free: profiles[0].employer_free
              });
            }
            
            // CRITICAL: Wenn keine Profile geladen wurden, prüfe warum
            if (profiles.length === 0 && userIds.length > 0) {
              console.error('[feed] CRITICAL: No profiles loaded at all! This could be:');
              console.error('[feed] 1. RLS policy blocking access');
              console.error('[feed] 2. Profiles really don\'t exist (deleted users)');
              console.error('[feed] 3. UUID format mismatch');
              
              // Test: Prüfe einzelne Profile
              console.log('[feed] Testing individual profile queries...');
              for (const testId of userIds.slice(0, 2)) {
                const { data: testProfile, error: testError } = await supabase
                  .from('profiles')
                  .select('id, vorname, nachname')
                  .eq('id', testId)
                  .single();
                
                if (testError) {
                  console.error(`[feed] Profile ${testId} query error:`, testError);
                } else if (testProfile) {
                  console.log(`[feed] Profile ${testId} EXISTS:`, testProfile);
                  // Add to profiles array if found
                  if (!profiles.find((p: any) => p.id === testId)) {
                    profiles.push(testProfile);
                  }
                } else {
                  console.warn(`[feed] Profile ${testId} does NOT exist`);
                }
              }
            }
            
            if (profiles.length < userIds.length) {
              console.warn('[feed] WARNING: Not all profiles loaded! Requested:', userIds.length, 'Got:', profiles.length);
              const missingIds = userIds.filter(id => !profiles.find((p: any) => p.id === id));
              console.warn('[feed] Missing profile IDs:', missingIds);
              
              // Debug: Prüfe, ob diese Profile wirklich nicht existieren
              if (missingIds.length > 0) {
                console.log('[feed] Checking if missing profiles exist in database...');
                const { data: checkProfiles, error: checkError } = await supabase
                  .from('profiles')
                  .select('id, vorname, nachname')
                  .in('id', missingIds);
                
                if (checkError) {
                  console.error('[feed] Error checking missing profiles:', checkError);
                } else {
                  console.log('[feed] Profiles found in direct query:', checkProfiles?.length || 0, checkProfiles);
                  if (checkProfiles && checkProfiles.length > 0) {
                    console.error('[feed] CRITICAL: Profiles exist but were not returned by .in() query! This is a data inconsistency issue.');
                    // Add found profiles to the profiles array
                    profiles.push(...checkProfiles);
                  } else {
                    console.warn('[feed] Profiles really do not exist - these are posts from deleted users');
                  }
                }
              }
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

          // CRITICAL: Use Object.fromEntries (same as comments - this works!)
          const profileMap = Object.fromEntries(
            (profiles || []).map((profile: any) => [profile.id, profile])
          ) as Record<string, any>;
          
          console.log('[feed] profileMap size:', Object.keys(profileMap).length);
          console.log('[feed] profileMap keys (user IDs):', Object.keys(profileMap));
          console.log('[feed] profileMap entries:', Object.entries(profileMap).slice(0, 3).map(([id, p]: [string, any]) => ({
            id,
            vorname: p.vorname,
            avatar_url: p.avatar_url ? 'SET' : 'NULL',
            headline: p.headline ? 'SET' : 'NULL',
            // CRITICAL: Log raw values to see what's actually in the map
            rawAvatarUrl: p.avatar_url,
            rawHeadline: p.headline
          })));
          
          // CRITICAL: Log full profile data for specific user ID from logs (60c459f8-212a-4595-b7d0-3fe0e39f8e4a)
          const testUserId = '60c459f8-212a-4595-b7d0-3fe0e39f8e4a';
          if (profileMap[testUserId]) {
            const testProfile = profileMap[testUserId];
            console.log('[feed] 🔍 TEST PROFILE DATA for user 60c459f8-212a-4595-b7d0-3fe0e39f8e4a:', {
              id: testProfile?.id,
              vorname: testProfile?.vorname,
              nachname: testProfile?.nachname,
              avatar_url: testProfile?.avatar_url,
              headline: testProfile?.headline,
              rawProfileObject: JSON.stringify(testProfile, null, 2)
            });
          } else {
            console.warn('[feed] ⚠️ TEST PROFILE NOT FOUND in profileMap for user 60c459f8-212a-4595-b7d0-3fe0e39f8e4a');
          }

          // Process ALL user posts, not just postsNeedingAuthorInfo
          // CRITICAL: Only process posts where we found a valid author profile
          allUserPosts.forEach((post) => {
            // CRITICAL: Use bracket notation (same as comments - this works!)
            const author = profileMap[post.user_id] ?? null;
            console.log('[feed] looking up author for post:', {
              postId: post.id,
              userId: post.user_id,
              userIdType: typeof post.user_id,
              found: !!author,
              profileMapHasKey: post.user_id in profileMap,
              profileMapSize: Object.keys(profileMap).length,
              allProfileIds: Object.keys(profileMap)
            });
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
              // CRITICAL: Log author data BEFORE assignment with raw values
              console.log('[feed] 🔍 Author data from profileMap:', {
                userId: post.user_id,
                authorId: author.id,
                authorAvatarUrl: author.avatar_url ? `SET: ${author.avatar_url.substring(0, 50)}...` : 'NULL',
                authorHeadline: author.headline ? `SET: ${author.headline}` : 'NULL',
                authorVorname: author.vorname,
                authorNachname: author.nachname,
                // CRITICAL: Log raw values to see what's actually in the author object
                rawAvatarUrl: author.avatar_url,
                rawHeadline: author.headline,
                rawAuthorObject: JSON.stringify(author, null, 2)
              });
              
              // CRITICAL: Use simple assignment (same as comments - this works!)
              // Just copy the author data directly without complex checks
              
              // Generate subtitle from profile data (current job/school)
              // Check if there's a linked company in the latest experience
              let linkedCompanyName: string | null = null;
              
              if (author.berufserfahrung && author.berufserfahrung.length > 0) {
                // Find current experience (no end date or "heute")
                const currentExp = author.berufserfahrung.find((exp: any) => 
                  !exp.zeitraum_bis || exp.zeitraum_bis === 'heute' || exp.zeitraum_bis === ''
                ) || author.berufserfahrung[0];
                
                // If experience has linked_company_id, try to find company name
                if (currentExp?.linked_company_id) {
                  // Check if post has company data
                  if (post.company?.name) {
                    linkedCompanyName = post.company.name;
                  } else {
                    // Try to get company name from the experience itself
                    linkedCompanyName = currentExp.unternehmen || null;
                  }
                }
              }
              
              // Generate subtitle using profile status line logic
              const generatedSubtitle = getFeedSubtitle(author, linkedCompanyName);
              
              post.author = {
                id: author.id,
                vorname: author.vorname,
                nachname: isUnlocked ? author.nachname : null, // Hide nachname if not unlocked for company users
                // CRITICAL: Direct assignment - no complex checks (same as comments)
                avatar_url: author.avatar_url ?? null,
                // Use generated subtitle instead of stored headline
                headline: generatedSubtitle || (author.headline ?? null),
                employer_free: author.employer_free ?? null,
                aktueller_beruf: author.aktueller_beruf ?? null,
                ausbildungsberuf: author.ausbildungsberuf ?? null,
                ausbildungsbetrieb: author.ausbildungsbetrieb ?? null,
                company_name: author.company_name ?? null,
                profile_slug: author.profile_slug ?? null,
              };
              
              console.log('[feed] ✅ Author data set for post:', {
                postId: post.id,
                userId: post.user_id,
                avatar_url: post.author.avatar_url ? `SET: ${post.author.avatar_url.substring(0, 50)}...` : 'NULL',
                headline: post.author.headline ? `SET: ${post.author.headline}` : 'NULL',
                vorname: post.author.vorname,
                nachname: post.author.nachname ? 'SET' : 'NULL',
                aktueller_beruf: post.author.aktueller_beruf ? 'SET' : 'NULL',
                ausbildungsberuf: post.author.ausbildungsberuf ? 'SET' : 'NULL',
                ausbildungsbetrieb: post.author.ausbildungsbetrieb ? 'SET' : 'NULL',
                employer_free: post.author.employer_free ? 'SET' : 'NULL',
                // CRITICAL: Log raw values to verify they're actually set
                rawAvatarUrl: post.author.avatar_url,
                rawHeadline: post.author.headline
              });
              
              // CRITICAL: Final verification - if still null, log detailed error
              if (!post.author.avatar_url && author.avatar_url) {
                console.error('[feed] ❌ CRITICAL: avatar_url not set but exists in author!', {
                  postId: post.id,
                  userId: post.user_id,
                  authorId: author.id,
                  authorAvatarUrl: author.avatar_url,
                  postAuthorAvatarUrl: post.author.avatar_url
                });
                // Force set it
                post.author.avatar_url = author.avatar_url;
              }
              if (!post.author.headline && author.headline) {
                console.error('[feed] ❌ CRITICAL: headline not set but exists in author!', {
                  postId: post.id,
                  userId: post.user_id,
                  authorId: author.id,
                  authorHeadline: author.headline,
                  postAuthorHeadline: post.author.headline
                });
                // Force set it
                post.author.headline = author.headline;
              }
              
              // CRITICAL: Final check - if still null after all attempts, log error with full author object
              if (!post.author.avatar_url) {
                console.error('[feed] ❌ CRITICAL: avatar_url is STILL NULL after all attempts!', {
                  postId: post.id,
                  userId: post.user_id,
                  authorId: author.id,
                  authorAvatarUrl: author.avatar_url,
                  authorObject: JSON.stringify(author, null, 2)
                });
              }
              if (!post.author.headline) {
                console.warn('[feed] ⚠️ headline is NULL after all attempts:', {
                  postId: post.id,
                  userId: post.user_id,
                  authorId: author.id,
                  authorHeadline: author.headline,
                  authorObject: JSON.stringify(author, null, 2)
                });
              }
            } else {
              console.error('[feed] AUTHOR NOT FOUND for user_id:', post.user_id, {
                postId: post.id,
                requestedUserIds: userIds,
                loadedProfileIds: Object.keys(profileMap),
                profileMapSize: Object.keys(profileMap).length,
                userIdInMap: post.user_id in profileMap
              });
              // Mark post for removal - it has no valid author
              post._shouldFilter = true;
            }
          });
          
          // CRITICAL: Filter out posts without valid authors (deleted users)
          // BUT: Don't filter posts that have author data, even if some fields are null
          const postsWithValidAuthors = transformedPosts.filter((post) => {
            if (post._shouldFilter) {
              console.warn('[feed] filtering post marked for removal:', post.id, post.user_id);
              return false;
            }
            // For user posts, ensure we have author info (at least id and vorname)
            if (post.author_type === 'user' && !post.author) {
              console.warn('[feed] filtering post without author:', post.id, post.user_id);
              return false;
            }
            // Debug: Log author data for verification
            if (post.author_type === 'user' && post.author) {
              console.log('[feed] ✅ Post has author data:', {
                postId: post.id,
                userId: post.user_id,
                authorId: post.author.id,
                avatar_url: post.author.avatar_url ? `SET: ${post.author.avatar_url.substring(0, 50)}...` : 'NULL',
                headline: post.author.headline ? `SET: ${post.author.headline.substring(0, 50)}...` : 'NULL',
                aktueller_beruf: post.author.aktueller_beruf ? 'SET' : 'NULL',
                ausbildungsberuf: post.author.ausbildungsberuf ? 'SET' : 'NULL',
                vorname: post.author.vorname,
                nachname: post.author.nachname ? 'SET' : 'NULL'
              });
            }
            return true;
          });
          
          console.log('[feed] Posts after filtering:', {
            before: transformedPosts.length,
            after: postsWithValidAuthors.length,
            filtered: transformedPosts.length - postsWithValidAuthors.length
          });
          
          // Replace transformedPosts with filtered version
          transformedPosts.length = 0;
          transformedPosts.push(...postsWithValidAuthors);
          
          // Final verification: Log all posts with their author data
          console.log('[feed] 📊 FINAL POSTS WITH AUTHOR DATA:');
          transformedPosts.forEach((post) => {
            if (post.author_type === 'user') {
              console.log(`[feed] Post ${post.id}:`, {
                userId: post.user_id,
                hasAuthor: !!post.author,
                authorId: post.author?.id,
                avatar_url: post.author?.avatar_url || 'NULL',
                headline: post.author?.headline || 'NULL',
                vorname: post.author?.vorname || 'NULL',
                nachname: post.author?.nachname || 'NULL'
              });
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
        nextPage: transformedPosts && transformedPosts.length === PAGE_SIZE
          ? {
              after_published: transformedPosts[transformedPosts.length - 1]?.created_at,
              after_id: transformedPosts[transformedPosts.length - 1]?.id,
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