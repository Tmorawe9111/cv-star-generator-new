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

// Section Header - Einheitlich
const SectionHeader: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  onSeeAll?: () => void;
  seeAllText?: string;
}> = ({ title, icon, onSeeAll, seeAllText = 'Alle' }) => (
  <div className="flex items-center justify-between px-4 mb-3 h-8">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    </div>
    {onSeeAll && (
      <button 
        onClick={onSeeAll}
        className="text-blue-500 text-sm font-medium flex items-center gap-0.5 active:opacity-70"
      >
        {seeAllText} <ChevronRight className="h-4 w-4" />
      </button>
    )}
  </div>
);

// Kleine Card für "Für dich" (Person oder Unternehmen)
const ForYouCard: React.FC<{ 
  item: Person | Company; 
  type: 'person' | 'company';
  onAction: () => void;
  actionLabel: string;
  actionDone?: boolean;
}> = ({ item, type, onAction, actionLabel, actionDone }) => {
  const isPerson = type === 'person';
  const person = item as Person;
  const company = item as Company;
  
  const name = isPerson 
    ? `${person.vorname ?? ''} ${person.nachname ?? ''}`.trim() || 'Unbekannt'
    : company.name;
  const subtitle = isPerson ? person.wunschberuf : company.industry;
  const imageUrl = isPerson ? person.avatar_url : company.logo_url;
  const linkTo = isPerson ? `/u/${person.id}` : `/companies/${company.id}`;

  return (
    <div className="min-w-[140px] max-w-[140px] bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center text-center">
      <Link to={linkTo}>
        <Avatar className="h-14 w-14 mb-2">
          <AvatarImage src={imageUrl ?? undefined} className="object-cover" />
          <AvatarFallback className="text-base font-semibold bg-gradient-to-br from-gray-100 to-gray-200">
            {isPerson ? <Users className="h-6 w-6 text-gray-400" /> : <Building2 className="h-6 w-6 text-gray-400" />}
          </AvatarFallback>
        </Avatar>
      </Link>
      <Link to={linkTo} className="w-full">
        <p className="font-semibold text-sm text-gray-900 truncate">{name}</p>
      </Link>
      {subtitle && <p className="text-xs text-gray-500 truncate w-full">{subtitle}</p>}
      <Button 
        size="sm" 
        onClick={onAction}
        disabled={actionDone}
        className={cn(
          "mt-2 w-full h-8 text-xs rounded-xl font-medium",
          actionDone 
            ? "bg-gray-100 text-gray-500" 
            : "bg-blue-500 hover:bg-blue-600 text-white"
        )}
      >
        {actionDone ? '✓' : actionLabel}
      </Button>
    </div>
  );
};

// Kompakte Company Card
const CompanyCardSmall: React.FC<{ company: Company }> = ({ company }) => {
  const { isFollowing, toggleFollow, loading } = useFollowCompany(company.id);
  
  return (
    <div className="min-w-[160px] bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
      <Link to={`/companies/${company.id}`}>
        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/companies/${company.id}`}>
          <p className="font-medium text-sm text-gray-900 truncate">{company.name}</p>
        </Link>
        <p className="text-xs text-gray-500 truncate">{company.industry || 'Unternehmen'}</p>
      </div>
      <Button 
        size="sm" 
        variant={isFollowing ? 'secondary' : 'default'}
        onClick={toggleFollow}
        disabled={loading}
        className={cn(
          "h-7 px-2 text-xs rounded-lg shrink-0",
          isFollowing ? "bg-gray-100 text-gray-600" : "bg-blue-500 text-white"
        )}
      >
        {isFollowing ? '✓' : 'Folgen'}
      </Button>
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

// Person Card (kompakt)
const PersonCardSmall: React.FC<{ 
  person: Person; 
  onConnect: () => void; 
  status: ConnectionState 
}> = ({ person, onConnect, status }) => {
  const name = `${person.vorname ?? ''} ${person.nachname ?? ''}`.trim() || 'Unbekannt';
  const isConnected = status === 'accepted';
  const isPending = status === 'pending';

  return (
    <div className="min-w-[140px] bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col items-center text-center">
      <Link to={`/u/${person.id}`}>
        <Avatar className="h-12 w-12 mb-2">
          <AvatarImage src={person.avatar_url ?? undefined} className="object-cover" />
          <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-50 to-purple-50">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <Link to={`/u/${person.id}`}>
        <p className="font-medium text-sm text-gray-900 truncate w-full">{person.vorname || 'Unbekannt'}</p>
      </Link>
      <p className="text-xs text-gray-500 truncate w-full mb-2">{person.wunschberuf || ''}</p>
      {!isConnected && !isPending ? (
        <Button 
          size="sm" 
          onClick={onConnect}
          className="w-full h-7 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
        >
          <UserPlus className="h-3 w-3 mr-1" /> Vernetzen
        </Button>
      ) : (
        <span className="text-xs text-gray-400">{isPending ? 'Angefragt' : 'Vernetzt ✓'}</span>
      )}
    </div>
  );
};

export default function MarketplaceMobile() {
  const { user } = useAuth();
  const { getStatuses, requestConnection } = useConnections();
  const [statusMap, setStatusMap] = React.useState<Record<string, ConnectionState>>({});
  const [authors, setAuthors] = React.useState<Record<string, { name: string; avatar_url: string | null }>>({});
  const [companyMap, setCompanyMap] = React.useState<Record<string, { name: string; logo_url: string | null }>>({});
  const postsScrollRef = useRef<HTMLDivElement>(null);

  // Fetch People
  const peopleQuery = useQuery<Person[]>({
    queryKey: ['mp-people-mobile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url, bio, wunschberuf')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return (data || []) as Person[];
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

  const scrollPosts = (dir: 'left' | 'right') => {
    if (postsScrollRef.current) {
      const scrollAmount = 300;
      postsScrollRef.current.scrollBy({ 
        left: dir === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  const filteredPeople = (peopleQuery.data || []).filter(p => p.id !== user?.id);
  const companies = companiesQuery.data || [];
  const posts = postsQuery.data || [];
  const jobs = jobsQuery.data || [];

  // "Für dich" - Mix aus Personen und Unternehmen
  const forYouItems: { item: Person | Company; type: 'person' | 'company' }[] = [];
  const maxForYou = 10;
  let pIdx = 0, cIdx = 0;
  while (forYouItems.length < maxForYou && (pIdx < filteredPeople.length || cIdx < companies.length)) {
    if (pIdx < filteredPeople.length) forYouItems.push({ item: filteredPeople[pIdx++], type: 'person' });
    if (forYouItems.length < maxForYou && cIdx < companies.length) forYouItems.push({ item: companies[cIdx++], type: 'company' });
  }

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
            {forYouItems.length > 0 ? forYouItems.map(({ item, type }) => (
              <ForYouCard 
                key={item.id}
                item={item}
                type={type}
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
      <div className="mt-6">
        <SectionHeader 
          title="Unternehmen" 
          icon={<Building2 className="h-5 w-5 text-blue-500" />}
          onSeeAll={() => {}}
        />
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 px-4 pb-2">
            {companies.slice(0, 8).map((company) => (
              <CompanyCardSmall key={company.id} company={company} />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Beiträge - Slider */}
      <div className="mt-6">
        <SectionHeader 
          title="Beiträge" 
          icon={<FileText className="h-5 w-5 text-green-500" />}
        />
        <div className="relative">
          {posts.length > 2 && (
            <>
              <button 
                onClick={() => scrollPosts('left')}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md rounded-full p-1.5 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button 
                onClick={() => scrollPosts('right')}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md rounded-full p-1.5 active:scale-95"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </>
          )}
          <div ref={postsScrollRef} className="overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex gap-3 px-4 pb-2">
              {posts.length > 0 ? posts.slice(0, 5).map((post) => (
                <PostCardSlider key={post.id} post={post} author={authors[post.user_id]} />
              )) : (
                <p className="text-sm text-gray-400 px-2">Keine Beiträge</p>
              )}
            </div>
          </div>
        </div>
        {posts.length > 0 && (
          <div className="px-4 mt-3">
            <Link to="/community">
              <Button variant="outline" className="w-full rounded-xl h-10 text-sm font-medium">
                Mehr Beiträge anzeigen
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

      {/* 5. Personen */}
      <div className="mt-6">
        <SectionHeader 
          title="Personen" 
          icon={<Users className="h-5 w-5 text-pink-500" />}
          onSeeAll={() => {}}
        />
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 px-4 pb-2">
            {filteredPeople.slice(0, 8).map((person) => (
              <PersonCardSmall 
                key={person.id} 
                person={person}
                onConnect={() => onConnect(person.id)}
                status={statusMap[person.id] ?? 'none'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 6. Gruppen - Coming Soon */}
      <div className="mt-6 px-4">
        <SectionHeader title="Gruppen" icon={<Users className="h-5 w-5 text-purple-500" />} />
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-5 text-center">
          <Users className="h-10 w-10 mx-auto mb-2 text-purple-400" />
          <h3 className="font-semibold text-gray-900 text-sm mb-1">Gruppen kommen bald!</h3>
          <p className="text-xs text-gray-600">
            Tausche dich mit Gleichgesinnten aus.
          </p>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-20" />
    </div>
  );
}
