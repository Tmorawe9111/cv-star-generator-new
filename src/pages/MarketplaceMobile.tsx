import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, Heart, MessageCircle, Building2, ChevronRight, Sparkles, Users, FileText } from 'lucide-react';
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
};

// Stories-Style Person Circle
const PersonStory: React.FC<{ person: Person; onConnect: () => void; status: ConnectionState }> = ({ 
  person, 
  onConnect,
  status 
}) => {
  const name = `${person.vorname ?? ''} ${person.nachname ?? ''}`.trim() || 'Unbekannt';
  const isConnected = status === 'accepted';
  const isPending = status === 'pending';
  
  return (
    <div className="flex flex-col items-center gap-2 min-w-[80px]">
      <Link to={`/u/${person.id}`}>
        <div className={cn(
          "relative p-[3px] rounded-full",
          isConnected 
            ? "bg-gradient-to-tr from-green-400 to-emerald-500" 
            : isPending
              ? "bg-gradient-to-tr from-yellow-400 to-orange-500"
              : "bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500"
        )}>
          <div className="bg-white p-[2px] rounded-full">
            <Avatar className="h-16 w-16">
              <AvatarImage src={person.avatar_url ?? undefined} alt={name} className="object-cover" />
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-gray-100 to-gray-200">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          {!isConnected && !isPending && (
            <button 
              onClick={(e) => { e.preventDefault(); onConnect(); }}
              className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1.5 shadow-lg active:scale-95 transition-transform"
            >
              <UserPlus className="h-3 w-3" />
            </button>
          )}
        </div>
      </Link>
      <span className="text-xs font-medium text-gray-700 text-center line-clamp-1 w-full px-1">
        {person.vorname || 'Unbekannt'}
      </span>
    </div>
  );
};

// Featured Person Card (Large)
const FeaturedPersonCard: React.FC<{ 
  person: Person; 
  onConnect: () => void; 
  status: ConnectionState;
  index: number;
}> = ({ person, onConnect, status, index }) => {
  const name = `${person.vorname ?? ''} ${person.nachname ?? ''}`.trim() || 'Unbekannt';
  const isConnected = status === 'accepted';
  const isPending = status === 'pending';

  return (
    <div 
      className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100"
      style={{ 
        animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.5s ease-out forwards',
        opacity: 0,
      }}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50/30" />
      
      <div className="relative p-5">
        <div className="flex items-start gap-4">
          <Link to={`/u/${person.id}`}>
            <Avatar className="h-20 w-20 ring-4 ring-white shadow-xl">
              <AvatarImage src={person.avatar_url ?? undefined} alt={name} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-100 to-purple-100 text-gray-700">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0 pt-1">
            <Link to={`/u/${person.id}`}>
              <h3 className="font-semibold text-lg text-gray-900 truncate">{name}</h3>
            </Link>
            {person.wunschberuf && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{person.wunschberuf}</p>
            )}
            {person.bio && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">{person.bio}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-5">
          {isConnected ? (
            <Button 
              className="flex-1 rounded-2xl h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
              variant="ghost"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Nachricht
            </Button>
          ) : isPending ? (
            <Button 
              className="flex-1 rounded-2xl h-12 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium border border-yellow-200"
              variant="ghost"
              disabled
            >
              Anfrage gesendet
            </Button>
          ) : (
            <Button 
              onClick={onConnect}
              className="flex-1 rounded-2xl h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Vernetzen
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            className="h-12 w-12 rounded-2xl bg-gray-50 hover:bg-pink-50 hover:text-pink-500 transition-colors"
          >
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Company Card (Horizontal Scroll)
const CompanyCard: React.FC<{ company: Company }> = ({ company }) => {
  const { isFollowing, toggleFollow, loading } = useFollowCompany(company.id);
  
  return (
    <div className="min-w-[200px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
      <Link to={`/companies/${company.id}`} className="flex items-center gap-3 mb-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 truncate">{company.name}</h4>
          {company.industry && (
            <p className="text-xs text-gray-500 truncate">{company.industry}</p>
          )}
        </div>
      </Link>
      <Button 
        size="sm" 
        variant={isFollowing ? 'secondary' : 'default'}
        onClick={toggleFollow}
        disabled={loading}
        className={cn(
          "rounded-xl h-9 text-sm font-medium w-full",
          isFollowing 
            ? "bg-gray-100 hover:bg-gray-200 text-gray-700" 
            : "bg-blue-500 hover:bg-blue-600 text-white"
        )}
      >
        {isFollowing ? 'Gefolgt ✓' : 'Folgen'}
      </Button>
    </div>
  );
};

// Section Header
const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode; onSeeAll?: () => void }> = ({ 
  title, 
  icon,
  onSeeAll 
}) => (
  <div className="flex items-center justify-between px-5 mb-4">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
    {onSeeAll && (
      <button 
        onClick={onSeeAll}
        className="text-blue-500 text-sm font-medium flex items-center gap-1 active:opacity-70"
      >
        Alle <ChevronRight className="h-4 w-4" />
      </button>
    )}
  </div>
);

// Post Card Component
const PostCard: React.FC<{ post: Post; author?: { name: string; avatar_url: string | null } }> = ({ post, author }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={author?.avatar_url ?? undefined} />
        <AvatarFallback>{(author?.name || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium text-sm text-gray-900">{author?.name || 'Unbekannt'}</p>
        <p className="text-xs text-gray-500">
          {new Date(post.created_at).toLocaleDateString('de-DE')}
        </p>
      </div>
    </div>
    <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{post.content}</p>
    {post.image_url && (
      <img src={post.image_url} alt="" className="mt-3 rounded-xl w-full h-40 object-cover" />
    )}
    <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
      <button className="flex items-center gap-1.5 text-gray-500 text-sm active:scale-95 transition-transform">
        <Heart className="h-4 w-4" /> Gefällt mir
      </button>
      <button className="flex items-center gap-1.5 text-gray-500 text-sm active:scale-95 transition-transform">
        <MessageCircle className="h-4 w-4" /> Kommentieren
      </button>
    </div>
  </div>
);

export default function MarketplaceMobile() {
  const { user } = useAuth();
  const { getStatuses, requestConnection } = useConnections();
  const [statusMap, setStatusMap] = React.useState<Record<string, ConnectionState>>({});
  const [authors, setAuthors] = React.useState<Record<string, { name: string; avatar_url: string | null }>>({});

  // Fetch People
  const peopleQuery = useQuery<Person[]>({
    queryKey: ['mp-people-mobile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url, bio, wunschberuf')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) {
        console.error('People query error:', error);
        return [];
      }
      return (data || []) as Person[];
    },
  });

  // Fetch Companies
  const companiesQuery = useQuery<Company[]>({
    queryKey: ['mp-companies-mobile'],
    queryFn: async () => {
      // Try direct query first
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, logo_url, industry')
        .limit(10);
      if (error) {
        console.error('Companies query error:', error);
        return [];
      }
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
      if (error) {
        console.error('Posts query error:', error);
        return [];
      }
      return (data || []) as Post[];
    },
  });

  // Fetch authors for posts
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
    try {
      if (!user) {
        window.location.href = '/auth';
        return;
      }
      await requestConnection(targetId);
      setStatusMap(prev => ({ ...prev, [targetId]: 'pending' }));
      toast({ title: '✨ Anfrage gesendet', description: 'Warte auf Bestätigung.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Fehler', description: 'Konnte Anfrage nicht senden.', variant: 'destructive' });
    }
  };

  const filteredPeople = (peopleQuery.data || []).filter(p => p.id !== user?.id);
  const storyPeople = filteredPeople.slice(0, 8);
  const featuredPeople = filteredPeople.slice(0, 6);
  const posts = postsQuery.data || [];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      {/* CSS Animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Hero Header */}
      <div className="bg-white pt-4 pb-6 px-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium text-blue-500">Entdecken</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Neue Kontakte
        </h1>
        <p className="text-gray-500 mt-1">Vernetze dich mit spannenden Menschen</p>
      </div>

      {/* Stories Section */}
      <div className="mt-6">
        <SectionHeader title="Vorgeschlagen" />
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-4 px-5 pb-2">
            {storyPeople.map((person) => (
              <PersonStory 
                key={person.id} 
                person={person} 
                onConnect={() => onConnect(person.id)}
                status={statusMap[person.id] ?? 'none'}
              />
            ))}
            {peopleQuery.isLoading && (
              <>
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex flex-col items-center gap-2 min-w-[80px] animate-pulse">
                    <div className="h-16 w-16 rounded-full bg-gray-200" />
                    <div className="h-3 w-12 rounded bg-gray-200" />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Companies Carousel */}
      {(companiesQuery.data?.length ?? 0) > 0 && (
        <div className="mt-8">
          <SectionHeader 
            title="Unternehmen" 
            icon={<Building2 className="h-5 w-5 text-gray-400" />}
          />
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-3 px-5 pb-2">
              {companiesQuery.data?.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured People Cards */}
      <div className="mt-8 px-5">
        <SectionHeader title="Für dich" icon={<Heart className="h-5 w-5 text-pink-500" />} />
        <div className="space-y-4">
          {featuredPeople.length > 0 ? (
            featuredPeople.map((person, index) => (
              <FeaturedPersonCard 
                key={person.id} 
                person={person}
                index={index}
                onConnect={() => onConnect(person.id)}
                status={statusMap[person.id] ?? 'none'}
              />
            ))
          ) : peopleQuery.isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-3xl bg-white p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2 pt-2">
                      <div className="h-5 w-32 rounded bg-gray-200" />
                      <div className="h-4 w-24 rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="h-12 w-full rounded-2xl bg-gray-200 mt-5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Noch keine Personen zum Vernetzen</p>
            </div>
          )}
        </div>
      </div>

      {/* Posts / Beiträge */}
      <div className="mt-8 px-5">
        <SectionHeader title="Beiträge" icon={<FileText className="h-5 w-5 text-blue-500" />} />
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.slice(0, 5).map((post) => (
              <PostCard key={post.id} post={post} author={authors[post.user_id]} />
            ))
          ) : postsQuery.isLoading ? (
            <div className="space-y-4">
              {[1,2].map(i => (
                <div key={i} className="rounded-2xl bg-white p-4 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 rounded bg-gray-200" />
                      <div className="h-3 w-16 rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="h-16 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Noch keine Beiträge</p>
            </div>
          )}
        </div>
      </div>

      {/* Gruppen Teaser */}
      <div className="mt-8 px-5">
        <SectionHeader title="Gruppen" icon={<Users className="h-5 w-5 text-purple-500" />} />
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-purple-400" />
          <h3 className="font-semibold text-gray-900 mb-1">Gruppen kommen bald!</h3>
          <p className="text-sm text-gray-600">
            Tausche dich mit Gleichgesinnten aus und finde deine Community.
          </p>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-24" />
    </div>
  );
}

