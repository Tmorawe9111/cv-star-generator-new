import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Briefcase, MessageSquare, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useCompany } from '@/hooks/useCompany';
import { Skeleton } from '@/components/ui/skeleton';

interface HistoryEvent {
  id: string;
  type: 'unlock' | 'interview_request' | 'interview_accepted' | 'interview_declined' | 'status_change' | 'job_assignment' | 'note';
  title: string;
  description: string;
  timestamp: string;
  jobTitle?: string | null;
  jobId?: string | null;
  status?: string | null;
  metadata?: Record<string, any>;
}

export default function CandidateHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useCompany();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && company?.id) {
      loadData();
    }
  }, [id, company?.id]);

  const loadData = async () => {
    if (!id || !company?.id) return;
    
    setLoading(true);
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, email, avatar_url')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load company_candidate
      const { data: candidateData, error: candidateError } = await supabase
        .from('company_candidates')
        .select('id, candidate_id, company_id, status, stage, unlocked_at, created_at, updated_at, interview_date, linked_job_ids')
        .eq('company_id', company.id)
        .eq('candidate_id', id)
        .maybeSingle();

      if (candidateError) throw candidateError;

      const events: HistoryEvent[] = [];

      // 1. Unlock event
      if (candidateData?.unlocked_at) {
        events.push({
          id: `unlock-${candidateData.id}`,
          type: 'unlock',
          title: 'Profil freigeschaltet',
          description: 'Das Profil wurde freigeschaltet und ist jetzt vollständig sichtbar.',
          timestamp: candidateData.unlocked_at,
        });
      }

      // 2. Interview requests
      const { data: interviewRequests, error: irError } = await supabase
        .from('interview_requests')
        .select(`
          id,
          interview_type,
          planned_at,
          status,
          created_at,
          accepted_at,
          declined_at,
          job_id,
          job_posts:job_id(title)
        `)
        .eq('candidate_id', id)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (!irError && interviewRequests) {
        interviewRequests.forEach((ir) => {
          const jobTitle = (ir.job_posts as any)?.title || null;
          
          if (ir.status === 'pending') {
            events.push({
              id: `ir-${ir.id}`,
              type: 'interview_request',
              title: 'Interview-Anfrage gesendet',
              description: `Interview-Anfrage für ${ir.interview_type === 'online' ? 'Online-Interview' : 'Vor-Ort-Interview'}`,
              timestamp: ir.created_at,
              jobTitle,
              jobId: ir.job_id,
              metadata: {
                interview_type: ir.interview_type,
                planned_at: ir.planned_at,
              },
            });
          } else if (ir.status === 'accepted') {
            events.push({
              id: `ir-accepted-${ir.id}`,
              type: 'interview_accepted',
              title: 'Interview-Anfrage angenommen',
              description: `Der Kandidat hat die Interview-Anfrage angenommen.`,
              timestamp: ir.accepted_at || ir.created_at,
              jobTitle,
              jobId: ir.job_id,
              metadata: {
                interview_type: ir.interview_type,
                planned_at: ir.planned_at,
              },
            });
          } else if (ir.status === 'declined') {
            events.push({
              id: `ir-declined-${ir.id}`,
              type: 'interview_declined',
              title: 'Interview-Anfrage abgelehnt',
              description: `Der Kandidat hat die Interview-Anfrage abgelehnt.`,
              timestamp: ir.declined_at || ir.created_at,
              jobTitle,
              jobId: ir.job_id,
            });
          }
        });
      }

      // 3. Status changes (from company_candidates)
      if (candidateData) {
        events.push({
          id: `status-${candidateData.id}`,
          type: 'status_change',
          title: `Status: ${candidateData.status || 'Unbekannt'}`,
          description: `Aktueller Status: ${candidateData.status}`,
          timestamp: candidateData.updated_at || candidateData.created_at,
          status: candidateData.status,
        });
      }

      // 4. Job assignments
      if (candidateData?.linked_job_ids && Array.isArray(candidateData.linked_job_ids) && candidateData.linked_job_ids.length > 0) {
        const { data: jobs, error: jobsError } = await supabase
          .from('job_posts')
          .select('id, title')
          .in('id', candidateData.linked_job_ids)
          .eq('company_id', company.id);

        if (!jobsError && jobs) {
          jobs.forEach((job) => {
            events.push({
              id: `job-${job.id}`,
              type: 'job_assignment',
              title: `Zuordnen zu: ${job.title}`,
              description: `Kandidat wurde der Stelle "${job.title}" zugeordnet.`,
              timestamp: candidateData.updated_at || candidateData.created_at,
              jobTitle: job.title,
              jobId: job.id,
            });
          });
        }
      }

      // 5. Applications
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          job_id,
          job_posts:job_id(title)
        `)
        .eq('candidate_id', id)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (!appError && applications) {
        applications.forEach((app) => {
          const jobTitle = (app.job_posts as any)?.title || null;
          events.push({
            id: `app-${app.id}`,
            type: 'status_change',
            title: `Bewerbung eingegangen${jobTitle ? ` für "${jobTitle}"` : ''}`,
            description: `Status: ${app.status}`,
            timestamp: app.created_at,
            jobTitle,
            jobId: app.job_id,
            status: app.status,
          });
        });
      }

      // Sort by timestamp (newest first)
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setHistory(events);
    } catch (error) {
      console.error('Error loading candidate history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'unlock':
        return <User className="h-4 w-4" />;
      case 'interview_request':
      case 'interview_accepted':
      case 'interview_declined':
        return <Calendar className="h-4 w-4" />;
      case 'job_assignment':
        return <Briefcase className="h-4 w-4" />;
      case 'status_change':
        return <Clock className="h-4 w-4" />;
      case 'note':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'unlock':
        return 'bg-green-100 text-green-700';
      case 'interview_request':
        return 'bg-blue-100 text-blue-700';
      case 'interview_accepted':
        return 'bg-green-100 text-green-700';
      case 'interview_declined':
        return 'bg-red-100 text-red-700';
      case 'job_assignment':
        return 'bg-purple-100 text-purple-700';
      case 'status_change':
        return 'bg-slate-100 text-slate-700';
      case 'note':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Historie: {profile?.vorname} {profile?.nachname}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vollständige Übersicht aller Interaktionen mit diesem Kandidaten
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chronologische Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Noch keine Historie vorhanden.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                        {event.jobTitle && (
                          <Badge variant="outline" className="mt-2">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {event.jobTitle}
                          </Badge>
                        )}
                        {event.metadata && event.metadata.planned_at && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {format(new Date(event.metadata.planned_at), "dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.timestamp), "dd.MM.yyyy HH:mm", { locale: de })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

