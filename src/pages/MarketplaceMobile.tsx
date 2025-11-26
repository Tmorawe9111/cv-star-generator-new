import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, Heart, MessageCircle, Building2, ChevronRight, 
  Sparkles, Users, FileText, Briefcase, MapPin, ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConnections, type ConnectionState } from '@/hooks/useConnections';
import { useFollowCompany } from '@/hooks/useFollowCompany';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Person = { 
  id: string; 
  vorname?: string | null; 
  nachname?: string | null; 
  avatar_url?: string | null;
  bio?: string | null;
  wunschberuf?: string | null;
};

type Company = { 
  id: string; 
  name: string; 
  logo_url?: string | null;
  industry?: string | null;
};

type Post = {
  id: string;
  content: string;
  image_url?: string | null;
  user_id: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
};

type Job = {
  id: string;
  title: string;
  company_id: string;
  location?: string | null;
  employment_type?: string | null;
};

// Section Header - Einheitlich (fixed height)
const SectionHeader: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  onSeeAll?: () => void;
  seeAllText?: string;
}> = ({ title, icon, onSeeAll, seeAllText = 'Alle' }) => (
  <div className="flex items-center justify-between px-4 mb-2 h-7">
    <div className="flex items-center gap-1.5">
      <span className="flex items-center justify-center w-5 h-5">{icon}</span>
      <h2 className="text-base font-semibold text-gray-900 leading-none">{title}</h2>
    </div>
    {onSeeAll && (
      <button 
        onClick={onSeeAll}
        className="text-blue-500 text-xs font-medium flex items-center active:opacity-70"
      >
        {seeAllText} <ChevronRight className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

// Card für "Für dich" (Person oder Unternehmen) - gleiche Größe wie andere Cards
const ForYouCard: React.FC<{ 
  item: Person | Company; 
  type: 'person' | 'company';
  onAction: () => void;
  actionLabel: string;
  actionDone?: boolean;
  index: number;
}> = ({ item, type, onAction, actionLabel, actionDone, index }) => {
  const isPerson = type === 'person';
  const person = item as Person;
  const company = item as Company;
  
  const name = isPerson 
    ? `${person.vorname ?? ''} ${person.nachname ?? ''}`.trim() || 'Unbekannt'
    : company.name;
  const subtitle = isPerson ? (person as any).bio?.slice(0, 30) : company.industry;
  const imageUrl = isPerson ? person.avatar_url : company.logo_url;
  const linkTo = isPerson ? `/u/${person.id}` : `/companies/${company.id}`;
  
  // Verschiedene Zahlen basierend auf Index
  const mutualCount = [3, 7, 2, 5, 4, 8, 6, 9, 1, 11][index % 10];
  const mutualNames = ['Max', 'Lisa', 'Tom', 'Anna', 'Jan', 'Sarah', 'Lukas', 'Emma', 'Felix', 'Marie'];
  const mutualName = mutualNames[index % 10];

  return (
    <div className="min-w-[160px] w-[160px] h-[200px] bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col">
      <Link to={linkTo} className="flex flex-col items-center">
        {isPerson ? (
          <Avatar className="h-14 w-14 mb-2">
            <AvatarImage src={imageUrl ?? undefined} className="object-cover" />
            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-50 to-purple-50">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden mb-2">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-gray-400" />
            )}
          </div>
        )}
        <p className="font-semibold text-sm text-gray-900 truncate w-full text-center">{name}</p>
        {subtitle && <p className="text-[10px] text-gray-500 truncate w-full text-center">{subtitle}</p>}
      </Link>
      
      {/* Gemeinsame Kontakte / Mitarbeiter */}
      <div className="flex-1 flex items-center justify-center mt-1">
        <OverlappingAvatars 
          avatars={DEMO_AVATARS} 
          count={mutualCount}
          label={isPerson 
            ? (mutualCount > 1 ? `${mutualName} +${mutualCount - 1}` : mutualName)
            : `${mutualCount} Mitarbeiter`
          }
        />
      </div>

      {/* Button - immer unten */}
      <div className="mt-auto pt-2">
        <Button 
          size="sm" 
          onClick={onAction}
          disabled={actionDone}
          className={cn(
            "w-full h-8 text-xs rounded-xl font-medium",
            actionDone 
              ? "bg-gray-100 text-gray-500" 
              : "bg-blue-500 hover:bg-blue-600 text-white"
          )}
        >
          {actionDone ? '✓' : actionLabel}
        </Button>
      </div>
    </div>
  );
};

// Placeholder avatars for demo
const DEMO_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
];

// Overlapping Avatars Component
const OverlappingAvatars: React.FC<{ 
  avatars: (string | null)[]; 
  count: number;
  label: string;
}> = ({ avatars, count, label }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex -space-x-2">
      {avatars.slice(0, 3).map((url, i) => (
        <Avatar key={i} className="h-5 w-5 border-2 border-white">
          <AvatarImage src={url || DEMO_AVATARS[i]} className="object-cover" />
          <AvatarFallback className="text-[8px] bg-gray-200">U</AvatarFallback>
        </Avatar>
      ))}
    </div>
    {count > 0 && (
      <span className="text-[10px] text-gray-500 leading-none">{label}</span>
    )}
  </div>
);

// Neue Person Card mit gemeinsamen Kontakten
const PersonCard: React.FC<{ 
  person: Person; 
  onConnect: () => void; 
  status: ConnectionState;
  index?: number;
}> = ({ person, onConnect, status, index = 0 }) => {
  const name = `${person.vorname ?? ''} ${person.nachname ?? ''}`.trim() || 'Unbekannt';
  const isConnected = status === 'accepted';
  const isPending = status === 'pending';
  
  // Verschiedene Zahlen basierend auf Index
  const mutualCounts = [4, 2, 6, 3, 8, 5, 1, 7, 9, 3];
  const mutualNames = ['Lisa', 'Tom', 'Anna', 'Max', 'Sarah', 'Jan', 'Emma', 'Lukas', 'Marie', 'Felix'];
  const mutualCount = mutualCounts[index % 10];
  const mutualName = mutualNames[index % 10];

  return (
    <div className="min-w-[160px] w-[160px] h-[200px] bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col">
      <Link to={`/u/${person.id}`} className="flex flex-col items-center">
        <Avatar className="h-14 w-14 mb-2">
          <AvatarImage src={person.avatar_url ?? undefined} className="object-cover" />
          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-50 to-purple-50">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold text-sm text-gray-900 truncate w-full text-center">{name}</p>
      </Link>
      
      {/* Gemeinsame Kontakte */}
      <div className="flex-1 flex items-center justify-center mt-1">
        <OverlappingAvatars 
          avatars={DEMO_AVATARS} 
          count={mutualCount}
          label={mutualCount > 1 ? `${mutualName} +${mutualCount - 1}` : mutualName}
        />
      </div>

      {/* Button - immer unten */}
      <div className="mt-auto pt-2">
        {!isConnected && !isPending ? (
          <Button 
            size="sm" 
            onClick={onConnect}
            className="w-full h-8 text-xs rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium"
          >
            <UserPlus className="h-3 w-3 mr-1" /> Vernetzen
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="secondary"
            disabled
            className="w-full h-8 text-xs rounded-xl bg-gray-100 text-gray-500"
          >
            {isPending ? 'Angefragt' : 'Vernetzt ✓'}
          </Button>
        )}
      </div>
    </div>
  );
};

// Neue Company Card mit Mitarbeitern
const CompanyCard: React.FC<{ 
  company: Company;
  index?: number;
}> = ({ company, index = 0 }) => {
  const { isFollowing, toggleFollow, loading } = useFollowCompany(company.id);
  
  // Verschiedene Mitarbeiterzahlen basierend auf Index
  const employeeCounts = [24, 8, 156, 42, 15, 67, 5, 89, 31, 12];
  const employeeCount = employeeCounts[index % 10];
  
  return (
    <div className="min-w-[160px] w-[160px] h-[200px] bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col">
      <Link to={`/companies/${company.id}`} className="flex flex-col items-center">
        <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden mb-2">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-7 w-7 text-gray-400" />
          )}
        </div>
        <p className="font-semibold text-sm text-gray-900 truncate w-full text-center">{company.name}</p>
        {company.industry && (
          <p className="text-[10px] text-gray-500 truncate w-full text-center">{company.industry}</p>
        )}
      </Link>
      
      {/* Mitarbeiter */}
      <div className="flex-1 flex items-center justify-center mt-1">
        <OverlappingAvatars 
          avatars={DEMO_AVATARS} 
          count={employeeCount}
          label={`${employeeCount} Mitarbeiter`}
        />
      </div>

      {/* Button - immer unten */}
      <div className="mt-auto pt-2">
        <Button 
          size="sm" 
          onClick={toggleFollow}
          disabled={loading}
          className={cn(
            "w-full h-8 text-xs rounded-xl font-medium",
            isFollowing 
              ? "bg-gray-100 hover:bg-gray-200 text-gray-600" 
              : "bg-blue-500 hover:bg-blue-600 text-white"
          )}
        >
          {isFollowing ? 'Gefolgt ✓' : 'Folgen'}
        </Button>
      </div>
    </div>
  );
};

// Post Card für Slider
const PostCardSlider: React.FC<{ 
  post: Post; 
  author?: { name: string; avatar_url: string | null } 
}> = ({ post, author }) => (
  <div className="min-w-[280px] max-w-[280px] h-[200px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
    <div className="flex items-center gap-2 mb-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={author?.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">{(author?.name || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-xs text-gray-900 truncate">{author?.name || 'Unbekannt'}</p>
        <p className="text-[10px] text-gray-500">
          {new Date(post.created_at).toLocaleDateString('de-DE')}
        </p>
      </div>
    </div>
    <p className="text-sm text-gray-700 line-clamp-4 flex-1 leading-relaxed">{post.content}</p>
    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500">
      <span className="flex items-center gap-1">
        <Heart className="h-3.5 w-3.5" /> {post.likes_count || 0}
      </span>
      <span className="flex items-center gap-1">
        <MessageCircle className="h-3.5 w-3.5" /> {post.comments_count || 0}
      </span>
    </div>
  </div>
);

// Job Card
const JobCard: React.FC<{ job: Job; companyName?: string; companyLogo?: string | null }> = ({ 
  job, companyName, companyLogo 
}) => (
  <Link to={`/stelle/${job.id}`} className="block">
    <div className="min-w-[200px] bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {companyLogo ? (
            <img src={companyLogo} alt="" className="h-full w-full object-cover" />
          ) : (
            <Briefcase className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{companyName || 'Unternehmen'}</p>
      </div>
      <p className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{job.title}</p>
      {job.location && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {job.location}
        </p>
      )}
    </div>
  </Link>
);


export default function MarketplaceMobile() {
  const { user } = useAuth();
  const { getStatuses, requestConnection } = useConnections();
  const [statusMap, setStatusMap] = React.useState<Record<string, ConnectionState>>({});
  const [authors, setAuthors] = React.useState<Record<string, { name: string; avatar_url: string | null }>>({});
  const [companyMap, setCompanyMap] = React.useState<Record<string, { name: string; logo_url: string | null }>>({});
  const postsScrollRef = useRef<HTMLDivElement>(null);
  const [postIndex, setPostIndex] = React.useState(0);

  // Fetch People (Users)
  const peopleQuery = useQuery<Person[]>({
    queryKey: ['mp-people-mobile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url, bio')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }
      
      return (data || []).filter(p => p.vorname || p.nachname) as Person[];
    },
  });

  // Fetch Companies
  const companiesQuery = useQuery<Company[]>({
    queryKey: ['mp-companies-mobile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, logo_url, industry')
        .limit(15);
      if (error) return [];
      return (data || []) as Company[];
    },
  });

  // Fetch Posts
  const postsQuery = useQuery<Post[]>({
    queryKey: ['mp-posts-mobile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, image_url, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) return [];
      return (data || []) as Post[];
    },
  });

  // Fetch Jobs
  const jobsQuery = useQuery<Job[]>({
    queryKey: ['mp-jobs-mobile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_posts')
        .select('id, title, company_id, location, employment_type')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) return [];
      return (data || []) as Job[];
    },
  });

  // Fetch authors for posts
  React.useEffect(() => {
    if (!postsQuery.data || postsQuery.data.length === 0) return;
    const ids = Array.from(new Set(postsQuery.data.map(p => p.user_id)));
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url')
        .in('id', ids);
      if (data) {
        const map: Record<string, { name: string; avatar_url: string | null }> = {};
        (data as any[]).forEach((p) => {
          map[p.id] = { 
            name: [p.vorname, p.nachname].filter(Boolean).join(' ') || 'Unbekannt', 
            avatar_url: p.avatar_url ?? null 
          };
        });
        setAuthors(map);
      }
    })();
  }, [postsQuery.data]);

  // Fetch company info for jobs
  React.useEffect(() => {
    if (!jobsQuery.data || jobsQuery.data.length === 0) return;
    const ids = Array.from(new Set(jobsQuery.data.map(j => j.company_id)));
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .in('id', ids);
      if (data) {
        const map: Record<string, { name: string; logo_url: string | null }> = {};
        (data as any[]).forEach((c) => {
          map[c.id] = { name: c.name, logo_url: c.logo_url ?? null };
        });
        setCompanyMap(map);
      }
    })();
  }, [jobsQuery.data]);

  // Load connection statuses
  React.useEffect(() => {
    if (!user || !peopleQuery.data || peopleQuery.data.length === 0) return;
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
    if (!user) {
      window.location.href = '/anmelden';
      return;
    }
    try {
      await requestConnection(targetId);
      setStatusMap(prev => ({ ...prev, [targetId]: 'pending' }));
      toast({ title: '✨ Anfrage gesendet' });
    } catch (e) {
      toast({ title: 'Fehler', variant: 'destructive' });
    }
  };

  const allPeople = (peopleQuery.data || []).filter(p => p.id !== user?.id);
  const allCompanies = companiesQuery.data || [];
  const posts = postsQuery.data || [];
  const jobs = jobsQuery.data || [];

  // Track scroll position for dots
  React.useEffect(() => {
    const el = postsScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const idx = Math.round(el.scrollLeft / 296);
      setPostIndex(idx);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [posts]);

  // "Für dich" - Mix aus Personen und Unternehmen (erste 3 von jedem)
  const forYouPeople = allPeople.slice(0, 3);
  const forYouCompanies = allCompanies.slice(0, 3);
  const forYouItems: { item: Person | Company; type: 'person' | 'company' }[] = [];
  let pIdx = 0, cIdx = 0;
  while (forYouItems.length < 6 && (pIdx < forYouPeople.length || cIdx < forYouCompanies.length)) {
    if (pIdx < forYouPeople.length) forYouItems.push({ item: forYouPeople[pIdx++], type: 'person' });
    if (forYouItems.length < 6 && cIdx < forYouCompanies.length) forYouItems.push({ item: forYouCompanies[cIdx++], type: 'company' });
  }

  // Unternehmen ab Index 3 (nicht in "Für dich")
  const companiesSection = allCompanies.slice(3);
  
  // Personen ab Index 3 (nicht in "Für dich")
  const peopleSection = allPeople.slice(3);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      {/* Header */}
      <div className="bg-white pt-4 pb-5 px-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-medium text-blue-500">Entdecken</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marketplace</h1>
        <p className="text-sm text-gray-500">Personen, Unternehmen & mehr</p>
      </div>

      {/* 1. Für dich */}
      <div className="mt-5">
        <SectionHeader 
          title="Für dich" 
          icon={<Sparkles className="h-5 w-5 text-yellow-500" />}
          onSeeAll={() => {}}
          seeAllText="Weitere"
        />
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 px-4 pb-2">
            {forYouItems.length > 0 ? forYouItems.map(({ item, type }, index) => (
              <ForYouCard 
                key={item.id}
                item={item}
                type={type}
                index={index}
                onAction={() => type === 'person' ? onConnect(item.id) : {}}
                actionLabel={type === 'person' ? 'Vernetzen' : 'Folgen'}
                actionDone={type === 'person' && statusMap[item.id] === 'accepted'}
              />
            )) : (
              <p className="text-sm text-gray-400 px-2">Keine Vorschläge</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Unternehmen */}
      {allCompanies.length > 0 && (
        <div className="mt-6">
          <SectionHeader 
            title="Unternehmen" 
            icon={<Building2 className="h-5 w-5 text-blue-500" />}
            onSeeAll={() => {}}
          />
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-3 px-4 pb-2">
              {allCompanies.slice(0, 8).map((company, idx) => (
                <CompanyCard key={company.id} company={company} index={idx} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Beiträge - Swipeable Cards */}
      <div className="mt-6">
        <SectionHeader 
          title="Beiträge" 
          icon={<FileText className="h-5 w-5 text-green-500" />}
        />
        {posts.length > 0 ? (
          <div className="relative px-4">
            {/* Swipeable Container */}
            <div 
              ref={postsScrollRef}
              className="overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              <div className="flex gap-3" style={{ width: `${posts.slice(0, 5).length * 296}px` }}>
                {posts.slice(0, 5).map((post, idx) => (
                  <div key={post.id} className="snap-center shrink-0">
                    <PostCardSlider post={post} author={authors[post.user_id]} />
                  </div>
                ))}
              </div>
            </div>
            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5 mt-3">
              {posts.slice(0, 5).map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    idx === postIndex ? "w-4 bg-blue-500" : "w-1.5 bg-gray-300"
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 px-4">Keine Beiträge</p>
        )}
        {posts.length > 0 && (
          <div className="px-4 mt-3 flex justify-end">
            <Link to="/community">
              <Button variant="ghost" size="sm" className="text-blue-500 text-sm font-medium">
                Mehr Beiträge <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* 4. Jobs */}
      <div className="mt-6">
        <SectionHeader 
          title="Jobs" 
          icon={<Briefcase className="h-5 w-5 text-purple-500" />}
          onSeeAll={() => {}}
          seeAllText="Alle Jobs"
        />
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 px-4 pb-2">
            {jobs.length > 0 ? jobs.slice(0, 6).map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                companyName={companyMap[job.company_id]?.name}
                companyLogo={companyMap[job.company_id]?.logo_url}
              />
            )) : (
              <p className="text-sm text-gray-400 px-2">Keine Jobs verfügbar</p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Personen (User) */}
      <div className="mt-6">
        <SectionHeader 
          title="Personen" 
          icon={<Users className="h-5 w-5 text-pink-500" />}
          onSeeAll={() => {}}
        />
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 px-4 pb-2">
            {peopleQuery.isLoading ? (
              [1,2,3,4].map(i => (
                <div key={i} className="min-w-[160px] w-[160px] h-[200px] bg-white rounded-2xl p-3 animate-pulse">
                  <div className="h-14 w-14 rounded-full bg-gray-200 mx-auto mb-2" />
                  <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-2" />
                  <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
                </div>
              ))
            ) : allPeople.length > 0 ? (
              allPeople.slice(0, 10).map((person, idx) => (
                <PersonCard 
                  key={person.id} 
                  person={person}
                  index={idx}
                  onConnect={() => onConnect(person.id)}
                  status={statusMap[person.id] ?? 'none'}
                />
              ))
            ) : (
              <p className="text-sm text-gray-400">Noch keine Nutzer registriert</p>
            )}
          </div>
        </div>
      </div>

      {/* 6. Gruppen - Coming Soon */}
      <div className="mt-6 px-4">
        <SectionHeader title="Gruppen" icon={<Users className="h-5 w-5 text-purple-500" />} />
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 text-sm">Gruppen kommen bald!</p>
            <p className="text-xs text-gray-500">Tausche dich mit Gleichgesinnten aus.</p>
          </div>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-20" />
    </div>
  );
}
