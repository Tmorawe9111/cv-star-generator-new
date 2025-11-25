
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useFollowCompany } from '@/hooks/useFollowCompany';
import { ExternalLink, MapPin, Globe, ArrowLeft, Linkedin, Instagram, ChevronDown, Briefcase, Users, Menu, Home, Plus, Network, Clock } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
// Minimal shape mapped to existing DB columns
type Company = {
  id: string;
  name: string;
  industry?: string | null;
  logo_url?: string | null;
  header_image?: string | null;
  size_range?: string | null; // employee count
  contact_person?: string | null;
  primary_email?: string | null;
  phone?: string | null;
  description?: string | null;
  website_url?: string | null;
  main_location?: string | null;
  country?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  mission_statement?: string | null;
  employee_count?: number | null;
};

export default function PublicCompanyView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const pid = profile?.id;

  // Review gate state
  const [pendingFromCompany, setPendingFromCompany] = useState<boolean>(false);
  const [reviewReady, setReviewReady] = useState<boolean>(false);
  const [aboutExpanded, setAboutExpanded] = useState<boolean>(false);

  const companyQuery = useQuery<Company | null>({
    queryKey: ['public-company', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .rpc('get_company_public', { p_id: id });
      if (error) throw error;
      const row = ((data as any[]) || [])[0] || null;
      return row as Company | null;
    },
    enabled: !!id,
  });

  // Check for pending follow request from this company to current profile
  const pendingQuery = useQuery({
    queryKey: ['pending-follow-request', id, pid],
    queryFn: async () => {
      if (!id || !pid) return false;
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_type', 'company')
        .eq('follower_id', id)
        .eq('followee_type', 'profile')
        .eq('followee_id', pid)
        .eq('status', 'pending')
        .maybeSingle();
      return Boolean(data);
    },
    enabled: !!id && !!pid,
  });

  useEffect(() => {
    setPendingFromCompany(pendingQuery.data || false);
  }, [pendingQuery.data]);

  const { isFollowing, loading, toggleFollow } = useFollowCompany(id);

  // Review gate: Scroll >= 60% or expand "About us"
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
      if (scrolled >= 0.6) {
        setReviewReady(true);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const markAboutSeen = () => {
    setReviewReady(true);
    setAboutExpanded(true);
  };

  const acceptFollowRequest = async () => {
    if (!pid || !reviewReady || !id) return;
    
    try {
      const { error } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('follower_type', 'company')
        .eq('follower_id', id)
        .eq('followee_type', 'profile')
        .eq('followee_id', pid)
        .eq('status', 'pending');

      if (error) throw error;

      setPendingFromCompany(false);
      toast({ description: 'Follow-Anfrage angenommen!' });
    } catch (error) {
      console.error('Error accepting follow request:', error);
      toast({ 
        variant: 'destructive', 
        description: 'Fehler beim Annehmen der Anfrage' 
      });
    }
  };

  const declineFollowRequest = async () => {
    if (!pid || !id) return;
    
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_type', 'company')
        .eq('follower_id', id)
        .eq('followee_type', 'profile')
        .eq('followee_id', pid)
        .eq('status', 'pending');

      if (error) throw error;

      setPendingFromCompany(false);
      toast({ description: 'Follow-Anfrage abgelehnt' });
    } catch (error) {
      console.error('Error declining follow request:', error);
      toast({ 
        variant: 'destructive', 
        description: 'Fehler beim Ablehnen der Anfrage' 
      });
    }
  };

  // Basic SEO
  useEffect(() => {
    const c = companyQuery.data;
    const title = c ? `${c.name} – Unternehmen` : 'Unternehmen';
    document.title = title;
    const desc = c?.description ? `${c.name}: ${c.description.slice(0, 150)}` : (c ? `${c.name} Unternehmensprofil` : 'Unternehmensprofil');
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = desc;

    // canonical
    const canonicalHref = window.location.origin + window.location.pathname;
    let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'canonical';
      document.head.appendChild(linkEl);
    }
    linkEl.href = canonicalHref;
  }, [companyQuery.data]);

const c = companyQuery.data;

  const tagsQuery = useQuery<Record<string, string[]>>({
    queryKey: ['company-tags', id],
    queryFn: async () => {
      if (!id) return {};
      const { data: links } = await supabase
        .from('company_tags')
        .select('tag_id')
        .eq('company_id', id);
      const ids = (links || []).map((r: any) => r.tag_id);
      if (!ids.length) return {};
      const { data: vocab } = await supabase
        .from('vocab_tags')
        .select('id,label,type')
        .in('id', ids);
      const map: Record<string, string[]> = {};
      (vocab || []).forEach((t: any) => {
        if (!map[t.type]) map[t.type] = [];
        map[t.type].push(t.label);
      });
      Object.keys(map).forEach((k) => map[k].sort((a, b) => a.localeCompare(b)));
      return map;
    },
    enabled: !!id,
  });

  // Fetch active jobs
  const jobsQuery = useQuery({
    queryKey: ['company-jobs', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('job_posts')
        .select('id, title, city, employment_type, created_at, is_active')
        .eq('company_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'jobs' | 'employees'>('home');

  if (companyQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unternehmen nicht gefunden</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Zurück</Button>
        </div>
      </div>
    );
  }

  const jobs = jobsQuery.data || [];
  // Extract postal code and city from main_location
  // Format could be "60311 Frankfurt am Main" or just "Frankfurt am Main"
  const locationParts = c.main_location?.split(' ') || [];
  const postalCode = locationParts[0]?.match(/^\d{5}$/) ? locationParts[0] : '';
  const city = postalCode 
    ? locationParts.slice(1).join(' ') 
    : c.main_location || '';

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden w-full">
      {/* PAGE WRAPPER */}
      <div className="mx-auto w-full max-w-full sm:max-w-5xl">
        {/* HERO / BANNER */}
        <div className="relative h-28 sm:h-36 md:h-44 lg:h-52 w-full bg-gradient-to-r from-indigo-500 to-blue-500 overflow-hidden">
          {c?.header_image && (
            <img 
              src={c.header_image} 
              alt={`${c.name} Banner`} 
              className="w-full h-full object-cover"
            />
          )}
          {/* Back Button */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> Zurück
            </Button>
          </div>
        </div>

        {/* CONTENT CARD */}
        <div className="-mt-8 sm:-mt-10 md:-mt-12 lg:-mt-14 px-2 sm:px-3 md:px-4 lg:px-6 pb-20 md:pb-24">
          <div className="relative rounded-lg bg-white p-3 shadow-sm sm:p-4 md:p-5 lg:p-6 w-full max-w-full mx-auto overflow-hidden box-border">
            {/* LOGO / AVATAR */}
            <div className="absolute left-1/2 top-0 flex -translate-y-1/2 -translate-x-1/2 transform md:left-4 md:translate-x-0">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-white shadow-md border-2 border-white shrink-0">
                {c?.logo_url ? (
                  <img 
                    src={c.logo_url} 
                    alt={`${c.name} Logo`} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-semibold text-blue-600">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* HEADER INFO */}
            <div className="mt-7 sm:mt-8 md:mt-2 flex flex-col items-center gap-2 sm:gap-2.5 md:flex-row md:items-start md:gap-4 md:pl-20 lg:pl-24">
              <div className="text-center md:text-left flex-1 min-w-0 w-full px-2 sm:px-0">
                <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                  {c.name}
                </h1>
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500 truncate">
                  {postalCode} {city} {c.industry ? `· ${c.industry}` : ''}
                </p>
              </div>

              {/* FOLLOW BUTTON */}
              <div className="mt-2 sm:mt-2.5 md:ml-auto md:mt-0 shrink-0">
                {pendingFromCompany ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={acceptFollowRequest}
                      disabled={!reviewReady}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      title={!reviewReady ? 'Bitte Profil ansehen (scrollen/öffnen), um anzunehmen' : 'Anfrage annehmen'}
                    >
                      Anfrage annehmen
                    </Button>
                    <Button
                      onClick={declineFollowRequest}
                      variant="outline"
                      size="sm"
                    >
                      Ablehnen
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={toggleFollow}
                    disabled={loading}
                    size="sm"
                    className={`rounded-full px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium transition ${
                      isFollowing
                        ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isFollowing ? "Gefolgt" : "Folgen"}
                  </Button>
                )}
              </div>
            </div>

            {/* TABS */}
            <div className="mt-3 sm:mt-4 border-b border-gray-100 w-full">
              <div className="flex gap-1 sm:gap-2 md:gap-3 lg:gap-4 overflow-x-auto text-xs sm:text-sm scrollbar-none -mx-2 sm:-mx-3 md:mx-0 px-2 sm:px-3 md:px-0">
                <button 
                  onClick={() => setActiveTab('home')}
                  className={`pb-2 sm:pb-2.5 md:pb-3 font-medium transition whitespace-nowrap shrink-0 ${
                    activeTab === 'home'
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Home
                </button>
                <button 
                  onClick={() => setActiveTab('about')}
                  className={`pb-2 sm:pb-2.5 md:pb-3 font-medium transition whitespace-nowrap shrink-0 ${
                    activeTab === 'about'
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Über {c.name}
                </button>
                <button 
                  onClick={() => setActiveTab('jobs')}
                  className={`pb-2 sm:pb-2.5 md:pb-3 font-medium transition whitespace-nowrap shrink-0 ${
                    activeTab === 'jobs'
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Jobs
                </button>
                <button 
                  onClick={() => setActiveTab('employees')}
                  className={`pb-2 sm:pb-2.5 md:pb-3 font-medium transition whitespace-nowrap shrink-0 ${
                    activeTab === 'employees'
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Mitarbeiter
                </button>
              </div>
            </div>

            {/* MAIN GRID (RESPONSIVE) */}
            {activeTab === 'home' && (
              <div className="mt-3 sm:mt-4 grid grid-cols-1 gap-2.5 sm:gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 w-full max-w-full">
                {/* Über das Unternehmen */}
                <section className="md:col-span-2 lg:col-span-2 rounded-lg border border-gray-100 bg-white p-3 sm:p-4 md:p-5 w-full max-w-full overflow-hidden box-border">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                    Über {c.name}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-gray-600 line-clamp-3 sm:line-clamp-4 md:line-clamp-none break-words">
                    {c?.description || "Noch keine Beschreibung hinterlegt."}
                  </p>
                  {c?.description && c.description.length > 150 && (
                    <button 
                      onClick={() => setActiveTab('about')}
                      className="mt-2 text-xs sm:text-sm font-medium text-blue-600 hover:underline md:hidden"
                    >
                      Mehr anzeigen →
                    </button>
                  )}
                </section>

                {/* Jobs */}
                <section className="rounded-lg border border-gray-100 bg-white p-3 sm:p-4 md:p-5 w-full max-w-full overflow-hidden box-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                      <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      Verfügbare Jobs
                    </h2>
                  </div>
                  {jobs.length === 0 ? (
                    <div className="mt-3 sm:mt-4 flex flex-col items-center justify-center gap-2 text-center text-xs sm:text-sm text-gray-500">
                      <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-gray-400" />
                      <span>Keine aktiven Jobs</span>
                    </div>
                  ) : (
                    <div className="mt-3 sm:mt-4 space-y-2">
                      {jobs.slice(0, 3).map((job: any) => (
                        <button
                          key={job.id}
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="w-full text-left border rounded-md p-2 sm:p-2.5 hover:bg-gray-50 transition-colors box-border"
                        >
                          <h3 className="font-semibold text-xs sm:text-sm truncate break-words">{job.title}</h3>
                          {job.city && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{job.city}</span>
                            </p>
                          )}
                        </button>
                      ))}
                      {jobs.length > 3 && (
                        <button
                          onClick={() => setActiveTab('jobs')}
                          className="w-full text-xs sm:text-sm text-blue-600 hover:underline mt-2"
                        >
                          Alle {jobs.length} Jobs anzeigen →
                        </button>
                      )}
                    </div>
                  )}
                </section>

                {/* Mitarbeiter */}
                <section className="rounded-lg border border-gray-100 bg-white p-3 sm:p-4 md:p-5 w-full max-w-full overflow-hidden box-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      Mitarbeiter
                    </h2>
                  </div>
                  <div className="mt-3 sm:mt-4 flex flex-col items-center justify-center gap-2 text-center text-xs sm:text-sm text-gray-500">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-gray-400" />
                    <span>Noch keine Mitarbeiter sichtbar</span>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="mt-4 space-y-2 sm:space-y-3">
            <Card className="p-2 sm:p-3 md:p-4">
              <Collapsible defaultOpen={aboutExpanded} onOpenChange={(open) => {
                if (open && !aboutExpanded) {
                  markAboutSeen();
                }
              }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold">Über uns</h2>
                  <div className="flex items-center gap-2">
                    {!aboutExpanded && pendingFromCompany && (
                      <Button 
                        onClick={markAboutSeen}
                        variant="link" 
                        size="sm"
                        className="text-xs p-0 h-auto text-primary"
                      >
                        Gelesen
                      </Button>
                    )}
                    <CollapsibleTrigger className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground [&[data-state=open]>.chev]:rotate-180">
                      <ChevronDown className="chev h-4 w-4 transition-transform" />
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent>
                  <p className="mt-2 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {c?.description || 'Dieses Unternehmen hat noch keine Beschreibung hinzugefügt.'}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {c?.mission_statement && (
              <Card className="p-2 sm:p-3 md:p-4">
                <Collapsible defaultOpen>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-semibold">Mission</h2>
                    <CollapsibleTrigger className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground [&[data-state=open]>.chev]:rotate-180">
                      <ChevronDown className="chev h-4 w-4 transition-transform" />
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <p className="mt-2 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      {c.mission_statement}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {tagsQuery.data && Object.keys(tagsQuery.data).length > 0 && (
              <Card className="p-2 sm:p-3 md:p-4">
                <Collapsible defaultOpen>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-semibold">Profil-Tags</h2>
                    <CollapsibleTrigger className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground [&[data-state=open]>.chev]:rotate-180">
                      <ChevronDown className="chev h-4 w-4 transition-transform" />
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      {tagsQuery.data.profession?.length ? (
                        <div>
                          <Label>Berufe/Professionen</Label>
                          <p className="text-muted-foreground mt-1">{tagsQuery.data.profession.join(', ')}</p>
                        </div>
                      ) : null}
                      {tagsQuery.data.must?.length ? (
                        <div>
                          <Label>Must-Haves</Label>
                          <p className="text-muted-foreground mt-1">{tagsQuery.data.must.join(', ')}</p>
                        </div>
                      ) : null}
                      {tagsQuery.data.nice?.length ? (
                        <div>
                          <Label>Nice-to-Haves</Label>
                          <p className="text-muted-foreground mt-1">{tagsQuery.data.nice.join(', ')}</p>
                        </div>
                      ) : null}
                      {tagsQuery.data.benefit?.length ? (
                        <div>
                          <Label>Benefits</Label>
                          <p className="text-muted-foreground mt-1">{tagsQuery.data.benefit.join(', ')}</p>
                        </div>
                      ) : null}
                      {tagsQuery.data.work_env?.length ? (
                        <div>
                          <Label>Arbeitsumfeld</Label>
                          <p className="text-muted-foreground mt-1">{tagsQuery.data.work_env.join(', ')}</p>
                        </div>
                      ) : null}
                      {tagsQuery.data.target_group?.length ? (
                        <div>
                          <Label>Zielgruppen</Label>
                          <p className="text-muted-foreground mt-1">{tagsQuery.data.target_group.join(', ')}</p>
                        </div>
                      ) : null}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            <Card className="p-2 sm:p-3 md:p-4">
              <Collapsible defaultOpen>
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold">Kontakt</h2>
                  <CollapsibleTrigger className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground [&[data-state=open]>.chev]:rotate-180">
                    <ChevronDown className="chev h-4 w-4 transition-transform" />
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="mt-2 text-xs sm:text-sm space-y-1">
                    {c?.contact_person && <div>Kontaktperson: {c.contact_person}</div>}
                    {c?.primary_email && <div>E-Mail: <a className="underline" href={`mailto:${c.primary_email}`}>{c.primary_email}</a></div>}
                    {c?.phone && <div>Telefon: <a className="underline" href={`tel:${c.phone}`}>{c.phone}</a></div>}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            <Card className="p-2 sm:p-3 md:p-4">
              <Collapsible defaultOpen>
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold">Standort</h2>
                  <CollapsibleTrigger className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground [&[data-state=open]>.chev]:rotate-180">
                    <ChevronDown className="chev h-4 w-4 transition-transform" />
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                    {c?.main_location ? `${c.main_location}${c.country ? `, ${c.country}` : ''}` : '—'}
                  </div>
                  <div className="mt-2 sm:mt-3 h-32 sm:h-40 rounded-lg bg-muted/60 border flex items-center justify-center text-xs text-muted-foreground">
                    Kartenansicht (bald verfügbar)
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>

                <Card className="p-2.5 sm:p-3 md:p-4">
                  <Collapsible defaultOpen>
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-semibold">Links</h2>
                      <CollapsibleTrigger className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground [&[data-state=open]>.chev]:rotate-180">
                        <ChevronDown className="chev h-4 w-4 transition-transform" />
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <div className="mt-2 flex flex-col gap-2 text-xs sm:text-sm">
                        {c?.website_url && (
                          <a href={c.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline">
                            <Globe className="h-4 w-4 mr-2" /> Webseite <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                        {c?.linkedin_url && (
                          <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline">
                            <Linkedin className="h-4 w-4 mr-2" /> LinkedIn <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                        {c?.instagram_url && (
                          <a href={c.instagram_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline">
                            <Instagram className="h-4 w-4 mr-2" /> Instagram <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="mt-4 space-y-2 sm:space-y-3">
                {jobs.length === 0 ? (
                  <Card className="p-4 sm:p-6 text-center">
                    <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-2 sm:mb-3" />
                    <p className="text-xs sm:text-sm text-gray-500">Keine aktiven Jobs</p>
                  </Card>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {jobs.map((job: any) => (
                      <Card key={job.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                        <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1.5 sm:mb-2">{job.title}</h3>
                        <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                          {job.city && (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              {job.city}
                            </div>
                          )}
                          {job.employment_type && (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              {job.employment_type}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'employees' && (
              <div className="mt-4">
                <Card className="p-4 sm:p-6 text-center">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-gray-500">Noch keine Mitarbeiter sichtbar</p>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM NAV – nur auf Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-gray-200 bg-white py-2 text-xs text-gray-500 md:hidden">
        <button className="flex flex-col items-center gap-1">
          <Menu className="h-5 w-5" />
          <span>Menü</span>
        </button>
        <button className="flex flex-col items-center gap-1" onClick={() => navigate('/mein-bereich')}>
          <Home className="h-5 w-5" />
          <span>Start</span>
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white text-xl">
          <Plus className="h-5 w-5" />
        </button>
        <button className="flex flex-col items-center gap-1" onClick={() => navigate('/community/jobs')}>
          <Briefcase className="h-5 w-5" />
          <span>Jobs</span>
        </button>
        <button className="flex flex-col items-center gap-1" onClick={() => navigate('/community/contacts')}>
          <Network className="h-5 w-5" />
          <span>Netzwerk</span>
        </button>
      </nav>
    </div>
  );
}
