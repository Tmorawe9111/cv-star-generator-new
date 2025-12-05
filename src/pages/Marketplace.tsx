import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import LeftOnThisPage from '@/components/marketplace/LeftOnThisPage';
import FilterChipsBar from '@/components/marketplace/FilterChipsBar';
import RightRail from '@/components/marketplace/RightRail';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MarketplaceComposer from '@/components/marketplace/MarketplaceComposer';
import { Plus, Check, X, UserPlus, Search } from 'lucide-react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConnections, type ConnectionState } from '@/hooks/useConnections';
import { toast } from '@/hooks/use-toast';
import { useFollowCompany } from '@/hooks/useFollowCompany';
import { openSearchMode } from '@/lib/event-bus';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import MarketplaceMobile from './MarketplaceMobile';
import PostCard from '@/components/community/PostCard';
import { CommonalitiesBadge } from '@/components/marketplace/CommonalitiesBadge';

// Simple types for the new sections
type Person = { 
  id: string; 
  vorname?: string | null; 
  nachname?: string | null; 
  avatar_url?: string | null;
  branche?: string | null;
  ort?: string | null;
  berufserfahrung?: any;
  schulbildung?: any;
};

type Company = { id: string; name: string; logo_url?: string | null; industry?: string | null };
type Post = { id: string; content: string; image_url?: string | null; user_id: string };

interface PersonWithCommonalities extends Person {
  mutualConnections?: Array<{ id: string; avatar_url: string | null; name: string }>;
  mutualCount?: number;
  commonSchools?: string[];
  commonValues?: string[];
  commonJobs?: Array<{ company: string; position: string }>;
}

interface CompanyWithCommonalities extends Company {
  mutualFollowers?: Array<{ id: string; avatar_url: string | null; name: string }>;
  mutualCount?: number;
  commonIndustry?: boolean;
  commonValues?: string[];
}

// Company Card Component - separate component to use hooks properly
const CompanyCard: React.FC<{ company: CompanyWithCommonalities }> = ({ company }) => {
  const { isFollowing, toggleFollow, loading } = useFollowCompany(company.id);
  
  return (
    <Card className="p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-border/50 h-[320px] flex flex-col">
      <div className="flex flex-col space-y-3 flex-1">
        <Link to={`/companies/${company.id}`} className="flex flex-col items-center text-center space-y-2 group">
          <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{company.name}</h3>
          </div>
        </Link>
        
        {/* Commonalities */}
        <div className="flex-1 flex items-start">
          <CommonalitiesBadge
            mutualConnections={company.mutualFollowers}
            mutualCount={company.mutualCount}
            commonValues={company.commonValues}
            type="company"
          />
        </div>
        
        {/* Button - Fixed height */}
        <div className="mt-auto pt-2">
          <Button 
            size="sm" 
            variant={isFollowing ? 'secondary' : 'default'} 
            onClick={toggleFollow}
            disabled={loading}
            className="w-full h-9"
          >
            {isFollowing ? 'Gefolgt' : 'Folgen'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default function Marketplace() {
  const isMobile = useIsMobile();
  
  // Show stunning mobile design on mobile devices
  if (isMobile) {
    return <MarketplaceMobile />;
  }

  return <MarketplaceDesktop />;
}

function MarketplaceDesktop() {
  const [q, setQ] = React.useState('');
  const [appliedQ, setAppliedQ] = React.useState('');
  const [openComposer, setOpenComposer] = React.useState(false);

  const [morePeople, setMorePeople] = React.useState(false);
  const [moreCompanies, setMoreCompanies] = React.useState(false);
  const [morePosts, setMorePosts] = React.useState(false);

  const { user } = useAuth();
  const { getStatuses, requestConnection, acceptRequest, declineRequest, cancelRequest } = useConnections();
  const [statusMap, setStatusMap] = React.useState<Record<string, ConnectionState>>({});
  const [authors, setAuthors] = React.useState<Record<string, { name: string; avatar_url: string | null }>>({});
  const location = useLocation();

  const [searchParams] = useSearchParams();
  React.useEffect(() => {
    const qp = searchParams.get('q') || '';
    setQ(qp);
    setAppliedQ(qp);
  }, [searchParams]);
  const typeParam = (searchParams.get('type') || '').toLowerCase();

  const handleSearch = () => setAppliedQ(q.trim());

  // Queries
  const peopleQuery = useQuery<PersonWithCommonalities[]>({
    queryKey: ['mp-people', appliedQ, morePeople, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const base = supabase.from('profiles')
        .select('id, vorname, nachname, avatar_url, branche, ort, berufserfahrung, schulbildung');
      const qy = appliedQ 
        ? base.or(`vorname.ilike.%${appliedQ}%,nachname.ilike.%${appliedQ}%`) 
        : base.order('created_at', { ascending: false });
      const { data, error } = await qy.limit(morePeople ? 18 : 6);
      if (error) throw error;
      
      const profiles = (data || []) as Person[];
      
      // Load current user's data for comparison
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('id, berufserfahrung, schulbildung')
        .eq('id', user.id)
        .single();
      
      // Load current user's values (using any to bypass type checking)
      // Use maybeSingle() to avoid 406 errors if user has no values
      const { data: currentUserValues } = await supabase
        .from('user_values' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Load current user's connections
      const { data: currentConnections } = await supabase
        .from('connections')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      
      const currentUserConnectionIds = new Set(
        (currentConnections || []).map(c => 
          c.requester_id === user.id ? c.addressee_id : c.requester_id
        )
      );
      
      // Enrich each profile with commonalities
      const enrichedProfiles = await Promise.all(profiles.map(async (profile) => {
        if (profile.id === user.id) return profile as PersonWithCommonalities;
        
        const enriched: PersonWithCommonalities = { ...profile };
        
        // Find mutual connections
        const { data: profileConnections } = await supabase
          .from('connections')
          .select('requester_id, addressee_id')
          .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
          .eq('status', 'accepted');
        
        const profileConnectionIds = new Set(
          (profileConnections || []).map(c => 
            c.requester_id === profile.id ? c.addressee_id : c.requester_id
          )
        );
        
        const mutualIds = Array.from(currentUserConnectionIds).filter(id => 
          profileConnectionIds.has(id) && id !== profile.id && id !== user.id
        );
        
        if (mutualIds.length > 0) {
          const { data: mutualProfiles } = await supabase
            .from('profiles')
            .select('id, vorname, nachname, avatar_url')
            .in('id', mutualIds.slice(0, 3));
          
          enriched.mutualConnections = (mutualProfiles || []).map(p => ({
            id: p.id,
            avatar_url: p.avatar_url,
            name: `${p.vorname || ''} ${p.nachname || ''}`.trim() || 'Unbekannt'
          }));
          enriched.mutualCount = mutualIds.length;
        }
        
        // Find common schools
        if (currentUser?.schulbildung && profile.schulbildung) {
          const currentSchools = Array.isArray(currentUser.schulbildung) 
            ? currentUser.schulbildung.map((s: any) => s.name || s.schule).filter(Boolean)
            : [];
          const profileSchools = Array.isArray(profile.schulbildung)
            ? profile.schulbildung.map((s: any) => s.name || s.schule).filter(Boolean)
            : [];
          
          enriched.commonSchools = currentSchools.filter((school: string) => 
            profileSchools.some((ps: string) => 
              ps.toLowerCase().includes(school.toLowerCase()) || 
              school.toLowerCase().includes(ps.toLowerCase())
            )
          );
        }
        
        // Find common values
        if (currentUserValues) {
          try {
            const { data: profileValues, error: profileValuesError } = await supabase
              .from('user_values' as any)
              .select('*')
              .eq('user_id', profile.id)
              .maybeSingle();
            
          // Ignore 406/400 errors (not found or RLS blocked) - user might not have values or access denied
          if (profileValues && !profileValuesError) {
            // Extract keywords from text answers for comparison
            // Compare if both users answered the same questions (simplified matching)
            const currentAnswers = [
              (currentUserValues as any).q1_team,
              (currentUserValues as any).q2_conflict,
              (currentUserValues as any).q3_reliable,
              (currentUserValues as any).q4_motivation,
              (currentUserValues as any).q5_stress,
              (currentUserValues as any).q6_environment,
              (currentUserValues as any).q7_respect,
              (currentUserValues as any).q8_expectations,
            ].filter(Boolean);
            
            const profileAnswers = [
              (profileValues as any).q1_team,
              (profileValues as any).q2_conflict,
              (profileValues as any).q3_reliable,
              (profileValues as any).q4_motivation,
              (profileValues as any).q5_stress,
              (profileValues as any).q6_environment,
              (profileValues as any).q7_respect,
              (profileValues as any).q8_expectations,
            ].filter(Boolean);
            
            // Simple matching: if both answered similar questions, show common values
            if (currentAnswers.length > 0 && profileAnswers.length > 0) {
              // Extract common keywords from answers (simplified)
              const commonKeywords: string[] = [];
              currentAnswers.forEach((answer: string) => {
                if (!answer) return;
                const words = answer.toLowerCase().split(/\s+/).filter(w => w.length > 4);
                profileAnswers.forEach((profileAnswer: string) => {
                  if (!profileAnswer) return;
                  words.forEach(word => {
                    if (profileAnswer.toLowerCase().includes(word) && !commonKeywords.includes(word)) {
                      commonKeywords.push(word);
                    }
                  });
                });
              });
              
              if (commonKeywords.length > 0) {
                enriched.commonValues = commonKeywords.slice(0, 3);
              }
            }
          }
          } catch (e) {
            // Silently ignore errors - user might not have values or RLS blocks access
            console.debug('Could not load profile values for comparison:', e);
          }
        }
        
        // Find common jobs (same position at different companies)
        if (currentUser?.berufserfahrung && profile.berufserfahrung) {
          const currentJobs = Array.isArray(currentUser.berufserfahrung)
            ? currentUser.berufserfahrung.map((j: any) => ({
                position: j.position || j.beruf || j.titel,
                company: j.unternehmen || j.company
              })).filter((j: any) => j.position && j.company)
            : [];
          
          const profileJobs = Array.isArray(profile.berufserfahrung)
            ? profile.berufserfahrung.map((j: any) => ({
                position: j.position || j.beruf || j.titel,
                company: j.unternehmen || j.company
              })).filter((j: any) => j.position && j.company)
            : [];
          
          enriched.commonJobs = currentJobs.filter((currentJob: any) =>
            profileJobs.some((profileJob: any) => {
              const currentPos = (currentJob.position || '').toLowerCase();
              const profilePos = (profileJob.position || '').toLowerCase();
              return currentPos === profilePos && currentJob.company !== profileJob.company;
            })
          ).map((j: any) => ({
            company: j.company,
            position: j.position
          }));
        }
        
        return enriched;
      }));
      
      return enrichedProfiles;
    },
  });


  // Load connection statuses for visible people (exclude self)
  React.useEffect(() => {
    if (!user || !peopleQuery.data) return;
    const ids = peopleQuery.data.map(p => p.id).filter(id => id !== user.id);
    if (ids.length === 0) return;
    (async () => {
      try {
        const statuses = await getStatuses(ids);
        setStatusMap(statuses);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user, peopleQuery.data, getStatuses]);

  const onConnect = async (targetId: string) => {
    try {
      if (!user) {
        window.location.href = '/auth';
        return;
      }
      await requestConnection(targetId);
      setStatusMap(prev => ({ ...prev, [targetId]: 'pending' }));
      toast({ title: 'Anfrage gesendet', description: 'Deine Verbindungsanfrage ist jetzt ausstehend.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Fehler', description: 'Konnte Anfrage nicht senden.', variant: 'destructive' });
    }
  };

  const onAccept = async (fromId: string) => {
    try {
      await acceptRequest(fromId);
      setStatusMap(prev => ({ ...prev, [fromId]: 'accepted' }));
      toast({ title: 'Verbunden', description: 'Ihr könnt jetzt chatten.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Fehler', description: 'Konnte Anfrage nicht annehmen.', variant: 'destructive' });
    }
  };

  const onDecline = async (fromId: string) => {
    try {
      await declineRequest(fromId);
      setStatusMap(prev => ({ ...prev, [fromId]: 'declined' }));
    } catch (e) {
      console.error(e);
      toast({ title: 'Fehler', description: 'Konnte Anfrage nicht ablehnen.', variant: 'destructive' });
    }
  };

  const onCancel = async (targetId: string) => {
    try {
      await cancelRequest(targetId);
      setStatusMap(prev => ({ ...prev, [targetId]: 'none' }));
    } catch (e) {
      console.error(e);
      toast({ title: 'Fehler', description: 'Konnte Anfrage nicht zurückziehen.', variant: 'destructive' });
    }
  };

  const companiesQuery = useQuery<CompanyWithCommonalities[]>({
    queryKey: ['mp-companies', appliedQ, moreCompanies, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get companies user already follows
      const { data: followedCompanies } = await supabase
        .from('follows')
        .select('followee_id')
        .eq('follower_id', user.id)
        .eq('follower_type', 'profile')
        .eq('followee_type', 'company')
        .eq('status', 'accepted');
      
      const followedIds = new Set((followedCompanies || []).map(f => f.followee_id));
      
      // Load current user's profile for comparison
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('branche')
        .eq('id', user.id)
        .single();
      
      // Load current user's values
      const { data: currentUserValues } = await supabase
        .from('user_values' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Load current user's connections
      const { data: currentConnections } = await supabase
        .from('connections')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      
      const currentUserConnectionIds = new Set(
        (currentConnections || []).map(c => 
          c.requester_id === user.id ? c.addressee_id : c.requester_id
        )
      );
      
      const { data, error } = await supabase.rpc('get_companies_public', {
        search: appliedQ || null,
        limit_count: moreCompanies ? 18 : 6,
        offset_count: 0,
      });
      if (error) return [] as CompanyWithCommonalities[]; // RLS may block; fail soft
      
      // Filter out followed companies
      const companies = (data || []).filter(c => !followedIds.has(c.id)) as Company[];
      
      // Enrich each company with commonalities
      const enrichedCompanies = await Promise.all(companies.map(async (company) => {
        const enriched: CompanyWithCommonalities = { ...company };
        
        // Find mutual followers (users who follow this company and are connected to current user)
        const { data: companyFollowers } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('followee_id', company.id)
          .eq('follower_type', 'profile')
          .eq('followee_type', 'company')
          .eq('status', 'accepted');
        
        const followerIds = (companyFollowers || []).map(f => f.follower_id);
        const mutualFollowerIds = followerIds.filter(id => 
          currentUserConnectionIds.has(id) && id !== user.id
        );
        
        if (mutualFollowerIds.length > 0) {
          const { data: mutualProfiles } = await supabase
            .from('profiles')
            .select('id, vorname, nachname, avatar_url')
            .in('id', mutualFollowerIds.slice(0, 3));
          
          enriched.mutualFollowers = (mutualProfiles || []).map(p => ({
            id: p.id,
            avatar_url: p.avatar_url,
            name: `${p.vorname || ''} ${p.nachname || ''}`.trim() || 'Unbekannt'
          }));
          enriched.mutualCount = mutualFollowerIds.length;
        }
        
        // Check common industry
        if (currentUser?.branche && company.industry) {
          enriched.commonIndustry = currentUser.branche.toLowerCase() === company.industry.toLowerCase();
        }
        
        // Find common values (if company has values)
        if (currentUserValues) {
          try {
            const { data: companyValues, error: companyValuesError } = await supabase
              .from('company_values' as any)
              .select('values_tags')
              .eq('company_id', company.id)
              .maybeSingle();
            
            // Ignore 406/400 errors (not found or RLS blocked) - company might not have values or access denied
            if (companyValues && !companyValuesError) {
              const currentValueTags = (currentUserValues as any).values_tags || [];
              const companyValueTags = (companyValues as any).values_tags || [];
              
              enriched.commonValues = currentValueTags.filter((tag: string) =>
                companyValueTags.includes(tag)
              );
            }
          } catch (e) {
            // Silently ignore errors - company might not have values or RLS blocks access
            console.debug('Could not load company values for comparison:', e);
          }
        }
        
        return enriched;
      }));
      
      return enrichedCompanies;
    },
  });

  const postsQuery = useQuery<any[]>({
    queryKey: ['mp-posts', appliedQ, morePosts, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Load current user's interests for personalization
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('branche, berufserfahrung, schulbildung')
        .eq('id', user.id)
        .single();
      
      const { data: currentUserValues } = await supabase
        .from('user_values' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Load user's connections to prioritize posts from connections
      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      
      const connectionIds = new Set(
        (connections || []).map(c => 
          c.requester_id === user.id ? c.addressee_id : c.requester_id
        )
      );
      
      // Load user's followed companies
      const { data: followedCompanies } = await supabase
        .from('follows')
        .select('followee_id')
        .eq('follower_id', user.id)
        .eq('follower_type', 'profile')
        .eq('followee_type', 'company')
        .eq('status', 'accepted');
      
      const followedCompanyIds = new Set((followedCompanies || []).map(f => f.followee_id));
      
      let qy = supabase.from('posts' as any)
        .select('id, content, image_url, user_id, created_at, author_type, author_id, company_id, post_type, job_id');
      
      if (appliedQ) {
        qy = qy.ilike('content', `%${appliedQ}%`);
      } else {
        qy = qy.order('created_at', { ascending: false });
      }
      
      const { data, error } = await qy.limit(morePosts ? 20 : 10);
      if (error) throw error;
      
      const posts = (data || []);
      
      // Personalize: prioritize posts from connections, followed companies, or matching interests
      const personalizedPosts = posts.map((post: any) => {
        let score = 0;
        
        // Higher score for posts from connections
        if (post.author_type === 'user' && connectionIds.has(post.user_id)) {
          score += 100;
        }
        
        // Higher score for posts from followed companies
        if (post.author_type === 'company' && followedCompanyIds.has(post.company_id)) {
          score += 80;
        }
        
        // Score based on content matching user's branch
        if (currentUser?.branche && post.content?.toLowerCase().includes(currentUser.branche.toLowerCase())) {
          score += 20;
        }
        
        // Score based on values matching (compare text answers with post content)
        if (currentUserValues && post.content) {
          const contentLower = post.content.toLowerCase();
          const userAnswers = [
            (currentUserValues as any).q1_team,
            (currentUserValues as any).q2_conflict,
            (currentUserValues as any).q3_reliable,
            (currentUserValues as any).q4_motivation,
            (currentUserValues as any).q5_stress,
            (currentUserValues as any).q6_environment,
            (currentUserValues as any).q7_respect,
            (currentUserValues as any).q8_expectations,
          ].filter(Boolean);
          
          // Check if post content mentions keywords from user's values
          let matchingCount = 0;
          userAnswers.forEach((answer: string) => {
            if (!answer) return;
            const keywords = answer.toLowerCase().split(/\s+/).filter(w => w.length > 4);
            keywords.forEach(keyword => {
              if (contentLower.includes(keyword)) {
                matchingCount++;
              }
            });
          });
          
          score += Math.min(matchingCount, 5) * 2; // Max 10 points
        }
        
        return { ...post, _personalizationScore: score };
      }).sort((a, b) => b._personalizationScore - a._personalizationScore);
      
      const userIds = [...new Set(personalizedPosts.filter((p: any) => p.author_type === 'user' && p.user_id).map((p: any) => p.user_id))];
      const companyIds = [...new Set(personalizedPosts.filter((p: any) => p.author_type === 'company' && p.company_id).map((p: any) => p.company_id))];
      
      const authorsMap = new Map();
      const companiesMap = new Map();
      
      if (userIds.length > 0) {
        const { data: authors } = await supabase
          .from("profiles")
          .select("id, vorname, nachname, avatar_url, headline, aktueller_beruf, ausbildungsberuf, ausbildungsbetrieb, status, employment_status, company_name")
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
      const postIds = personalizedPosts.map((p: any) => p.id);
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
      
      return personalizedPosts.map((post: any) => {
        const { _personalizationScore, ...postData } = post;
        const authorType = (post.author_type || 'user') as 'user' | 'company';
        return {
          ...postData,
          author_type: authorType,
          author: authorType === 'user' ? authorsMap.get(post.user_id) : null,
          company: authorType === 'company' ? companiesMap.get(post.company_id) : null,
          like_count: likeMap.get(post.id) || 0,
          comment_count: commentMap.get(post.id) || 0,
        };
      });
    },
  });

React.useEffect(() => {
    if (!postsQuery.data || postsQuery.data.length === 0) return;
    const ids = Array.from(new Set(postsQuery.data.map(p => p.user_id)));
    if (ids.length === 0) return;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url')
        .in('id', ids);
      if (!error && data) {
        const map: Record<string, { name: string; avatar_url: string | null }> = {};
        (data as any[]).forEach((p) => {
          const name = [p.vorname, p.nachname].filter(Boolean).join(' ') || 'Unbekannt';
          map[p.id] = { name, avatar_url: p.avatar_url ?? null };
        });
        setAuthors(map);
      }
    })();
  }, [postsQuery.data]);

  React.useEffect(() => {
    if (location.hash && location.hash.startsWith('#post-')) {
      const id = location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
      }
    }
  }, [location.hash, postsQuery.data]);

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {/* Mobile: Search Bar - clickable to open search mode */}
      <div 
        className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200"
        onClick={() => openSearchMode()}
      >
        <div className="px-3 py-3">
          <div className="relative">
            <Input 
              placeholder="Suchen..." 
              readOnly
              value={q}
              className="pr-10 h-10 text-sm cursor-pointer bg-gray-50"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Chips under header - Sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-4">
          <FilterChipsBar />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_320px] gap-8">
        {/* Left: Auf dieser Seite - Sticky */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <LeftOnThisPage />
          </div>
        </div>

        {/* Center: Sections (filter by type) */}
        <div className="space-y-8">
          {(() => {
            const type = typeParam;
            const showPeople = !type || type === 'people';
            const showCompanies = !type || type === 'companies';
            const showPosts = !type || type === 'posts';
            const showGroups = !type || type === 'groups';
            return (
              <>
                {showPeople && (
                  <section id="personen">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Interessante Personen</h2>
                        <Button variant="ghost" size="sm" onClick={() => setMorePeople((v) => !v)}>
                          {morePeople ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                        </Button>
                      </div>
                      {peopleQuery.isLoading ? (
                        <div className="text-sm text-muted-foreground py-8 text-center">Lade Personen…</div>
                      ) : (peopleQuery.data || []).filter((p) => 
                        p.id !== user?.id && 
                        statusMap[p.id] !== 'accepted' && 
                        statusMap[p.id] !== 'pending'
                      ).length === 0 ? (
                        <div className="text-sm text-muted-foreground py-8 text-center">Keine Personen gefunden.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(peopleQuery.data || []).filter((p) => 
                            p.id !== user?.id && 
                            statusMap[p.id] !== 'accepted' && 
                            statusMap[p.id] !== 'pending'
                          ).map((p) => {
                            const name = `${p.vorname ?? ''} ${p.nachname ?? ''}`.trim() || 'Unbekannt';
                            return (
                              <Card key={p.id} className="p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-border/50 h-[320px] flex flex-col">
                                <div className="flex flex-col space-y-3 flex-1">
                                  <Link to={`/u/${p.id}`} className="flex flex-col items-center text-center space-y-2 group">
                                    <Avatar className="h-16 w-16 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                      <AvatarImage src={p.avatar_url ?? undefined} alt={name} />
                                      <AvatarFallback className="text-lg">{name.slice(0,2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-semibold text-base group-hover:text-primary transition-colors">
                                        {p.vorname ?? ''} {p.nachname ?? ''}
                                      </div>
                                      {p.branche && (
                                        <div className="text-sm text-muted-foreground mt-0.5">{p.branche}</div>
                                      )}
                                      {p.ort && (
                                        <div className="text-xs text-muted-foreground mt-0.5">{p.ort}</div>
                                      )}
                                    </div>
                                  </Link>
                                  
                                  {/* Commonalities */}
                                  <div className="flex-1 flex items-start">
                                    <CommonalitiesBadge
                                      mutualConnections={p.mutualConnections}
                                      mutualCount={p.mutualCount}
                                      commonSchools={p.commonSchools}
                                      commonValues={p.commonValues}
                                      commonJobs={p.commonJobs}
                                      type="person"
                                    />
                                  </div>
                                  
                                  {/* Button - Fixed height */}
                                  <div className="mt-auto pt-2">
                                    {((statusMap[p.id] ?? 'none') === 'none' || (statusMap[p.id] ?? 'none') === 'declined') && (
                                      <Button size="sm" variant="default" onClick={() => onConnect(p.id)} className="w-full h-9">
                                        <UserPlus className="h-4 w-4 mr-1" /> Vernetzen
                                      </Button>
                                    )}
                                    {(statusMap[p.id] === 'incoming') && (
                                      <div className="flex gap-2">
                                        <Button size="sm" variant="default" onClick={() => onAccept(p.id)} className="flex-1 h-9">
                                          <Check className="h-4 w-4 mr-1" /> Annehmen
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => onDecline(p.id)} className="h-9">
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {showCompanies && (
                  <section id="unternehmen">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Interessante Unternehmen</h2>
                        <Button variant="ghost" size="sm" onClick={() => setMoreCompanies((v) => !v)}>
                          {moreCompanies ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                        </Button>
                      </div>
                      {companiesQuery.isLoading ? (
                        <div className="text-sm text-muted-foreground py-8 text-center">Lade Unternehmen…</div>
                      ) : (companiesQuery.data || []).length === 0 ? (
                        <div className="text-sm text-muted-foreground py-8 text-center">Keine Unternehmen gefunden.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(companiesQuery.data || []).map((c) => (
                            <CompanyCard key={c.id} company={c as CompanyWithCommonalities} />
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {showPosts && (
                  <section id="beitraege">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Interessante Beiträge</h2>
                        <Button variant="ghost" size="sm" onClick={() => setMorePosts((v) => !v)}>
                          {morePosts ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                        </Button>
                      </div>
                      {postsQuery.isLoading ? (
                        <div className="text-sm text-muted-foreground py-8 text-center">Lade Beiträge…</div>
                      ) : (postsQuery.data || []).length === 0 ? (
                        <div className="text-sm text-muted-foreground py-8 text-center">Keine Beiträge gefunden.</div>
                      ) : (
                        <div className="space-y-4">
                          {(postsQuery.data || []).map((post: any) => {
                            const authorType = (post.author_type === 'company' ? 'company' : 'user') as 'user' | 'company';
                            const postCardData = {
                              id: post.id,
                              content: post.content ?? '',
                              image_url: post.image_url ?? null,
                              media: Array.isArray(post.media) ? post.media : [],
                              documents: Array.isArray(post.documents) ? post.documents : [],
                              user_id: post.user_id,
                              author_type: authorType,
                              author_id: post.author_id ?? post.user_id,
                              company_id: post.company_id ?? null,
                              like_count: post.like_count ?? 0,
                              comment_count: post.comment_count ?? 0,
                              share_count: post.share_count ?? 0,
                              created_at: post.created_at,
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
                            return <PostCard key={post.id} post={postCardData} />;
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {showGroups && (
                  <section id="gruppen">
                    <Card className="p-4 rounded-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h2 className="text-lg font-semibold">Gruppen</h2>
                        <Button variant="ghost" size="sm" disabled>
                          Mehr anzeigen
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">Gruppen werden hier angezeigt, sobald verfügbar.</div>
                    </Card>
                  </section>
                )}
              </>
            );
          })()}

        </div>

        {/* Right rail */}
        <div className="hidden xl:block"><RightRail /></div>
      </div>

      {/* Mobile FAB - positioned above BottomNav */}
      <Button className="md:hidden fixed bottom-24 right-5 h-12 w-12 rounded-full shadow-lg min-h-[48px] min-w-[48px]" size="icon" onClick={() => setOpenComposer(true)}>
        <Plus className="h-5 w-5" />
      </Button>

      {/* Composer */}
      <MarketplaceComposer open={openComposer} onOpenChange={setOpenComposer} />
    </div>
  );
}
