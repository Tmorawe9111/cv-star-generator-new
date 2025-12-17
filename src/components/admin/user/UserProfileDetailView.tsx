import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { AdminUser } from '@/hooks/useUsers';
import { 
  Briefcase, Building2, Eye, Lock, Calendar, MapPin, Mail, Phone, 
  GraduationCap, Award, FileText, TrendingUp, Users, MessageSquare,
  CheckCircle2, Clock, XCircle, ArrowRight
} from 'lucide-react';
import { APPLICATION_STATUS_CONFIG } from '@/utils/applicationStatus';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfileStats {
  totalUnlocks: number;
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  companiesUnlocked: number;
  lastUnlockAt: string | null;
  profileViews: number;
}

interface UnlockDetail {
  id: string;
  company_id: string;
  company_name: string;
  level: 'basic' | 'contact';
  unlocked_at: string;
  job_posting_id: string | null;
  job_title: string | null;
}

interface ApplicationDetail {
  id: string;
  job_id: string;
  job_title: string;
  company_id: string;
  company_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UserProfileDetailViewProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDetailView({ user, open, onOpenChange }: UserProfileDetailViewProps) {
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [unlocks, setUnlocks] = useState<UnlockDetail[]>([]);
  const [applications, setApplications] = useState<ApplicationDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !open) return;

    const loadProfileData = async () => {
      setLoading(true);
      try {
        // Load full profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfileData(profile);

        // Load unlock stats
        const { data: unlockData, error: unlockError } = await supabase
          .from('profile_unlocks')
          .select(`
            id,
            company_id,
            level,
            unlocked_at,
            job_posting_id,
            companies!inner(name),
            job_posts(title)
          `)
          .eq('profile_id', user.id)
          .order('unlocked_at', { ascending: false });

        if (unlockError && unlockError.code !== 'PGRST116') {
          console.warn('Unlock data error:', unlockError);
        }

        const unlockDetails: UnlockDetail[] = (unlockData || []).map((u: any) => ({
          id: u.id,
          company_id: u.company_id,
          company_name: u.companies?.name || 'Unbekannt',
          level: u.level,
          unlocked_at: u.unlocked_at,
          job_posting_id: u.job_posting_id,
          job_title: u.job_posts?.title || null,
        }));

        setUnlocks(unlockDetails);

        // Load applications
        const { data: applicationsData, error: appsError } = await supabase
          .from('applications')
          .select(`
            id,
            job_id,
            company_id,
            status,
            created_at,
            updated_at,
            job_posts!inner(title),
            companies!inner(name)
          `)
          .eq('candidates.user_id', user.id)
          .order('created_at', { ascending: false });

        if (appsError && appsError.code !== 'PGRST116') {
          console.warn('Applications data error:', appsError);
        }

        const applicationDetails: ApplicationDetail[] = (applicationsData || []).map((app: any) => ({
          id: app.id,
          job_id: app.job_id,
          job_title: app.job_posts?.title || 'Unbekannt',
          company_id: app.company_id,
          company_name: app.companies?.name || 'Unbekannt',
          status: app.status || 'new',
          created_at: app.created_at,
          updated_at: app.updated_at,
        }));

        setApplications(applicationDetails);

        // Calculate stats
        const totalUnlocks = unlockDetails.length;
        const totalApplications = applicationDetails.length;
        const applicationsByStatus: Record<string, number> = {};
        applicationDetails.forEach(app => {
          applicationsByStatus[app.status] = (applicationsByStatus[app.status] || 0) + 1;
        });
        const companiesUnlocked = new Set(unlockDetails.map(u => u.company_id)).size;
        const lastUnlockAt = unlockDetails.length > 0 ? unlockDetails[0].unlocked_at : null;

        // Load profile views from analytics
        const { data: analyticsData } = await supabase
          .from('analytics_events')
          .select('*')
          .eq('event_type', 'user_action')
          .eq('metadata->>actionType', 'profile_view')
          .eq('metadata->>targetId', user.id)
          .order('created_at', { ascending: false });

        const profileViews = analyticsData?.length || 0;

        setStats({
          totalUnlocks,
          totalApplications,
          applicationsByStatus,
          companiesUnlocked,
          lastUnlockAt,
          profileViews,
        });
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user, open]);

  if (!user) return null;

  const getStatusBadge = (status: string) => {
    const config = APPLICATION_STATUS_CONFIG[status as keyof typeof APPLICATION_STATUS_CONFIG];
    if (!config) return <Badge variant="secondary">{status}</Badge>;
    return (
      <Badge className={`${config.bgColor} ${config.color} border-0`}>
        {config.icon} {config.label}
      </Badge>
    );
  };

  const getLevelBadge = (level: string) => {
    if (level === 'contact') {
      return <Badge className="bg-green-500 hover:bg-green-600">Contact</Badge>;
    }
    return <Badge className="bg-blue-500 hover:bg-blue-600">Basic</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="border-b pb-4 mb-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-2xl font-semibold mb-1">
                {profileData?.vorname && profileData?.nachname 
                  ? `${profileData.vorname} ${profileData.nachname}`
                  : user.email || 'Unbekannt'}
              </SheetTitle>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              {profileData?.headline && (
                <p className="text-sm mt-2">{profileData.headline}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Stats Cards - LinkedIn Style */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Freigeschaltet</CardDescription>
                    <Lock className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-2xl font-semibold">{stats?.totalUnlocks || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {stats?.companiesUnlocked || 0} Unternehmen
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Bewerbungen</CardDescription>
                    <Briefcase className="h-4 w-4 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl font-semibold">{stats?.totalApplications || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {stats?.applicationsByStatus['new'] || 0} Neu
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Profile Views</CardDescription>
                    <Eye className="h-4 w-4 text-purple-500" />
                  </div>
                  <CardTitle className="text-2xl font-semibold">{stats?.profileViews || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Gesamt Aufrufe</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Status</CardDescription>
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  </div>
                  <CardTitle className="text-lg font-semibold">
                    {stats?.applicationsByStatus['interview'] || 0} Interview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {stats?.applicationsByStatus['offer'] || 0} Angebot
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="applications">Bewerbungen</TabsTrigger>
                <TabsTrigger value="unlocks">Freischaltungen</TabsTrigger>
                <TabsTrigger value="activity">Aktivität</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-4">
                {/* Profile Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profil Informationen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profileData?.ort && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{profileData.ort}</span>
                        {profileData?.plz && <span className="text-muted-foreground">({profileData.plz})</span>}
                      </div>
                    )}
                    {profileData?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{profileData.email}</span>
                      </div>
                    )}
                    {profileData?.telefon && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{profileData.telefon}</span>
                      </div>
                    )}
                    {profileData?.status && (
                      <div className="flex items-center gap-2">
                        <Badge>{profileData.status}</Badge>
                        {profileData?.branche && <Badge variant="outline">{profileData.branche}</Badge>}
                      </div>
                    )}
                    {user.created_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Mitglied seit {new Date(user.created_at).toLocaleDateString('de-DE')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Application Status Overview */}
                {stats && Object.keys(stats.applicationsByStatus).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Bewerbungs Status Übersicht</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(stats.applicationsByStatus).map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                            <span className="text-sm font-medium">{APPLICATION_STATUS_CONFIG[status as keyof typeof APPLICATION_STATUS_CONFIG]?.label || status}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="applications" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bewerbungen ({applications.length})</CardTitle>
                    <CardDescription>Alle Bewerbungen und deren Status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {applications.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Noch keine Bewerbungen
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {applications.map((app) => (
                          <div key={app.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{app.job_title}</h4>
                                <p className="text-xs text-muted-foreground">{app.company_name}</p>
                              </div>
                              {getStatusBadge(app.status)}
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Beworben: {new Date(app.created_at).toLocaleDateString('de-DE')}</span>
                              </div>
                              {app.updated_at !== app.created_at && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Update: {new Date(app.updated_at).toLocaleDateString('de-DE')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="unlocks" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Freischaltungen ({unlocks.length})</CardTitle>
                    <CardDescription>Alle Unternehmen, die dieses Profil freigeschaltet haben</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {unlocks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Noch keine Freischaltungen
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {unlocks.map((unlock) => (
                          <div key={unlock.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-blue-500" />
                                  {unlock.company_name}
                                </h4>
                                {unlock.job_title && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Für: {unlock.job_title}
                                  </p>
                                )}
                              </div>
                              {getLevelBadge(unlock.level)}
                            </div>
                            <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(unlock.unlocked_at).toLocaleDateString('de-DE', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Aktivität</CardTitle>
                    <CardDescription>Letzte Aktivitäten und Interaktionen</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats?.lastUnlockAt && (
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <Lock className="h-5 w-5 text-blue-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Letzte Freischaltung</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(stats.lastUnlockAt).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                      {applications.length > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <Briefcase className="h-5 w-5 text-green-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Letzte Bewerbung</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(applications[0].created_at).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

