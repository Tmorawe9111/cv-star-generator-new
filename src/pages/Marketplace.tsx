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

// Simple types for the new sections
 type Person = { id: string; vorname?: string | null; nachname?: string | null; avatar_url?: string | null };
 type Company = { id: string; name: string; logo_url?: string | null };
 type Post = { id: string; content: string; image_url?: string | null; user_id: string };

const CompanyListItem: React.FC<{ c: Company }> = ({ c }) => {
  const { isFollowing, toggleFollow, loading } = useFollowCompany(c.id);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link to={`/companies/${c.id}`} className="h-8 w-8 rounded bg-muted overflow-hidden flex-shrink-0">
        {c.logo_url ? <img src={c.logo_url} alt={c.name} /> : null}
      </Link>
      <Link to={`/companies/${c.id}`} className="text-sm font-medium truncate hover:underline">
        {c.name}
      </Link>
      <div className="w-full sm:w-auto sm:ml-auto">
        <Button size="sm" variant={isFollowing ? 'secondary' : 'default'} onClick={toggleFollow} disabled={loading}>
          {isFollowing ? 'Gefolgt' : 'Folgen'}
        </Button>
      </div>
    </div>
  );
};

export default function Marketplace() {
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
  const peopleQuery = useQuery<Person[]>({
    queryKey: ['mp-people', appliedQ, morePeople],
    queryFn: async () => {
      const base = supabase.from('profiles').select('id, vorname, nachname, avatar_url');
      const qy = appliedQ ? base.or(`vorname.ilike.%${appliedQ}%,nachname.ilike.%${appliedQ}%`) : base.order('created_at', { ascending: false });
      const { data, error } = await qy.limit(morePeople ? 18 : 6);
      if (error) throw error;
      return (data || []) as Person[];
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

  const companiesQuery = useQuery<Company[]>({
    queryKey: ['mp-companies', appliedQ, moreCompanies],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_companies_public', {
        search: appliedQ || null,
        limit_count: moreCompanies ? 18 : 6,
        offset_count: 0,
      });
      if (error) return [] as Company[]; // RLS may block; fail soft
      return (data || []) as Company[];
    },
  });

  const postsQuery = useQuery<Post[]>({
    queryKey: ['mp-posts', appliedQ, morePosts],
    queryFn: async () => {
      let qy = supabase.from('posts').select('id, content, image_url, user_id, created_at');
      if (appliedQ) qy = qy.ilike('content', `%${appliedQ}%`);
      else qy = qy.order('created_at', { ascending: false });
      const { data, error } = await qy.limit(morePosts ? 18 : 6);
      if (error) throw error;
      return (data || []) as Post[];
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

      {/* Chips under header */}
      <div className="border-b">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-3">
          <FilterChipsBar />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_320px] gap-6">
        {/* Left: Auf dieser Seite */}
        <div className="hidden lg:block"><LeftOnThisPage /></div>

        {/* Center: Sections (filter by type) */}
        <div className="space-y-6">
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
                    <Card className="p-4 rounded-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h2 className="text-lg font-semibold">Interessante Personen</h2>
                        <Button variant="ghost" size="sm" onClick={() => setMorePeople((v) => !v)}>
                          {morePeople ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {(peopleQuery.data || []).filter((p) => p.id !== user?.id && statusMap[p.id] !== 'accepted').map((p) => {
                          const name = `${p.vorname ?? ''} ${p.nachname ?? ''}`.trim() || 'Unbekannt';
                          return (
                            <div key={p.id} className="flex flex-wrap items-center gap-3">
                              <Link to={`/u/${p.id}`} className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={p.avatar_url ?? undefined} alt={name} />
                                  <AvatarFallback>{name.slice(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="text-sm font-medium truncate hover:underline">{name}</div>
                              </Link>
                              <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2 flex-wrap">
                                {((statusMap[p.id] ?? 'none') === 'none' || (statusMap[p.id] ?? 'none') === 'declined') && (
                                  <Button size="sm" variant="secondary" onClick={() => onConnect(p.id)}>
                                    <UserPlus className="h-4 w-4 mr-1" /> Vernetzen
                                  </Button>
                                )}
                                {(statusMap[p.id] === 'pending') && (
                                  <>
                                    <Button size="sm" variant="outline" disabled>
                                      Ausstehend
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => onCancel(p.id)}>
                                      Zurückziehen
                                    </Button>
                                  </>
                                )}
                                {(statusMap[p.id] === 'incoming') && (
                                  <>
                                    <Button size="sm" variant="secondary" onClick={() => onAccept(p.id)}>
                                      <Check className="h-4 w-4 mr-1" /> Annehmen
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => onDecline(p.id)}>
                                      <X className="h-4 w-4 mr-1" /> Ablehnen
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {peopleQuery.isLoading && <div className="text-sm text-muted-foreground">Lade Personen…</div>}
                        {!peopleQuery.isLoading && (peopleQuery.data || []).length === 0 && (
                          <div className="text-sm text-muted-foreground">Keine Personen gefunden.</div>
                        )}
                      </div>
                    </Card>
                  </section>
                )}

                {showCompanies && (
                  <section id="unternehmen">
                    <Card className="p-4 rounded-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h2 className="text-lg font-semibold">Interessante Unternehmen</h2>
                        <Button variant="ghost" size="sm" onClick={() => setMoreCompanies((v) => !v)}>
                          {moreCompanies ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                        </Button>
                      </div>
                      <div className="space-y-3">
{(companiesQuery.data || []).map((c) => (
  <CompanyListItem key={c.id} c={c} />
))}
                        {companiesQuery.isLoading && <div className="text-sm text-muted-foreground">Lade Unternehmen…</div>}
                        {!companiesQuery.isLoading && (companiesQuery.data || []).length === 0 && (
                          <div className="text-sm text-muted-foreground">Keine Unternehmen gefunden.</div>
                        )}
                      </div>
                    </Card>
                  </section>
                )}

                {showPosts && (
                  <section id="beitraege">
                    <Card className="p-4 rounded-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h2 className="text-lg font-semibold">Interessante Beiträge</h2>
                        <Button variant="ghost" size="sm" onClick={() => setMorePosts((v) => !v)}>
                          {morePosts ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {(postsQuery.data || []).map((post) => (
                          <div key={post.id} className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded bg-muted/60 flex-shrink-0" />
                            <div className="text-sm leading-relaxed line-clamp-3">{post.content}</div>
                          </div>
                        ))}
                        {postsQuery.isLoading && <div className="text-sm text-muted-foreground">Lade Beiträge…</div>}
                        {!postsQuery.isLoading && (postsQuery.data || []).length === 0 && (
                          <div className="text-sm text-muted-foreground">Keine Beiträge gefunden.</div>
                        )}
                      </div>
                    </Card>
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
