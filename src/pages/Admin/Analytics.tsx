import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, MousePointerClick, Eye, Calendar, FileText, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface AnalyticsSummary {
  totalEvents: number;
  buttonClicks: number;
  pageViews: number;
  calendlyClicks: number;
  cvSteps: number;
  cvErrors: number;
  cvCompletions: number;
  cvAbandonments: number;
  pageViewsByPage: Record<string, number>;
  buttonClicksByLabel: Record<string, number>;
  cvStepCompletions: Record<number, number>;
  cvErrorsByType: Record<string, number>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        // Fetch events excluding admin pages
        const { data: eventsData, error } = await supabase
          .from('analytics_events')
          .select('*')
          .not('page_path', 'like', '/admin%')
          .order('created_at', { ascending: false })
          .limit(2000);

        if (error) throw error;

        setEvents(eventsData || []);

        // Calculate summary
        const summary: AnalyticsSummary = {
          totalEvents: eventsData?.length || 0,
          buttonClicks: eventsData?.filter(e => e.event_type === 'button_click').length || 0,
          pageViews: eventsData?.filter(e => e.event_type === 'page_view').length || 0,
          calendlyClicks: eventsData?.filter(e => e.button_type === 'calendly').length || 0,
          cvSteps: eventsData?.filter(e => e.event_type === 'cv_step').length || 0,
          cvErrors: eventsData?.filter(e => e.event_type === 'cv_error').length || 0,
          cvCompletions: eventsData?.filter(e => e.event_type === 'cv_completion').length || 0,
          cvAbandonments: eventsData?.filter(e => e.event_type === 'cv_abandonment').length || 0,
          pageViewsByPage: {},
          buttonClicksByLabel: {},
          cvStepCompletions: {},
          cvErrorsByType: {},
        };

        eventsData?.forEach(event => {
          if (event.event_type === 'page_view' && event.event_name) {
            summary.pageViewsByPage[event.event_name] = (summary.pageViewsByPage[event.event_name] || 0) + 1;
          }
          if (event.event_type === 'button_click' && event.button_label) {
            summary.buttonClicksByLabel[event.button_label] = (summary.buttonClicksByLabel[event.button_label] || 0) + 1;
          }
          if (event.event_type === 'cv_step' && event.metadata?.step) {
            const step = event.metadata.step;
            summary.cvStepCompletions[step] = (summary.cvStepCompletions[step] || 0) + 1;
          }
          if (event.event_type === 'cv_error' && event.metadata?.errorType) {
            const errorType = event.metadata.errorType;
            summary.cvErrorsByType[errorType] = (summary.cvErrorsByType[errorType] || 0) + 1;
          }
        });

        setSummary(summary);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="px-3 sm:px-6 py-6 max-w-[1600px] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="px-3 sm:px-6 py-6 max-w-[1600px] mx-auto">
        <p className="text-muted-foreground">Keine Daten verfügbar</p>
      </div>
    );
  }

  const pageViewsData = Object.entries(summary.pageViewsByPage)
    .map(([page, count]) => ({ page, views: count as number }))
    .sort((a, b) => b.views - a.views);

  const buttonClicksData = Object.entries(summary.buttonClicksByLabel)
    .map(([label, clicks]) => ({ label, clicks: clicks as number }))
    .sort((a, b) => b.clicks - a.clicks);

  const topButtonClicks = buttonClicksData.slice(0, 10);

  return (
    <div className="px-3 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Live-Tracking von BeVisiblle.de (Admin-Seiten ausgeschlossen)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Gesamt Events</CardDescription>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-4xl font-bold">{summary.totalEvents.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Alle erfassten Events</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Seitenaufrufe</CardDescription>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-4xl font-bold">{summary.pageViews.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{pageViewsData.length} verschiedene Seiten</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Button Klicks</CardDescription>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-4xl font-bold">{summary.buttonClicks.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{buttonClicksData.length} verschiedene Buttons</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Calendly Klicks</CardDescription>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {summary.calendlyClicks.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Conversion-Interesse</p>
          </CardContent>
        </Card>
      </div>

      {/* CV Generator Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mt-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>CV Steps</CardDescription>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {summary.cvSteps.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Getrackte CV Steps</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>CV Completions</CardDescription>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <CardTitle className="text-4xl font-bold text-green-600 dark:text-green-400">
              {summary.cvCompletions.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Erfolgreich abgeschlossen</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>CV Errors</CardDescription>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <CardTitle className="text-4xl font-bold text-red-600 dark:text-red-400">
              {summary.cvErrors.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Fehlermeldungen</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>CV Abbrüche</CardDescription>
              <XCircle className="h-4 w-4 text-orange-500" />
            </div>
            <CardTitle className="text-4xl font-bold text-orange-600 dark:text-orange-400">
              {summary.cvAbandonments.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Nicht abgeschlossen</p>
          </CardContent>
        </Card>
      </div>

      {/* CV Step Completion Chart */}
      {Object.keys(summary.cvStepCompletions).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>CV Step Completion Funnel</CardTitle>
            <CardDescription>Anzahl der Completions pro Step</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(summary.cvStepCompletions)
                .map(([step, count]) => ({ step: `Step ${step}`, count }))
                .sort((a, b) => Number(a.step.split(' ')[1]) - Number(b.step.split(' ')[1]))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="step" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* CV Errors by Type */}
      {Object.keys(summary.cvErrorsByType).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>CV Errors nach Typ</CardTitle>
            <CardDescription>Häufigkeit der Fehlertypen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(summary.cvErrorsByType)
                .sort(([, a], [, b]) => b - a)
                .map(([errorType, count]) => (
                  <div key={errorType} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium text-sm">{errorType}</span>
                    <span className="text-2xl font-bold text-red-600">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Page Views Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Seitenaufrufe</CardTitle>
            <CardDescription>Die meistbesuchten Seiten</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pageViewsData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="page" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Button Clicks Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Button Klicks Verteilung</CardTitle>
            <CardDescription>Top 10 geklickte Buttons</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topButtonClicks}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, percent }) => `${label.slice(0, 20)} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="clicks"
                  nameKey="label"
                >
                  {topButtonClicks.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* All Button Clicks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Button Klicks</CardTitle>
          <CardDescription>Komplette Liste aller geklickten Buttons mit Anzahl</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 max-h-[500px] overflow-auto">
            {buttonClicksData.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.label}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-3xl font-bold text-primary">{item.clicks}</span>
                  <span className="text-xs text-muted-foreground">Klicks</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Live Event Stream</CardTitle>
          <CardDescription>Die neuesten 100 Events in Echtzeit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-auto">
            {events.slice(0, 100).map((event, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {event.event_type === 'page_view' ? (
                    <Eye className="h-5 w-5 text-blue-500" />
                  ) : event.button_type === 'calendly' ? (
                    <Calendar className="h-5 w-5 text-purple-500" />
                  ) : (
                    <MousePointerClick className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      event.event_type === 'page_view' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                        : event.button_type === 'calendly'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {event.event_type === 'page_view' ? 'Page View' : 'Button Click'}
                    </span>
                    {event.button_type === 'calendly' && (
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-purple-500 text-white">
                        Calendly
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold mt-2 break-words">
                    {event.event_name}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {event.page_path && <span>📍 {event.page_path}</span>}
                    {event.button_label && event.event_type === 'button_click' && (
                      <span>🔘 {event.button_label}</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.created_at).toLocaleDateString('de-DE')}
                  </p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.created_at).toLocaleTimeString('de-DE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>ℹ️ Hinweis zum Tracking</CardTitle>
          <CardDescription>
            Diese Analytics zeigen nur Daten von der öffentlichen BeVisiblle.de Website. Admin-Seiten werden automatisch vom Tracking ausgeschlossen. 
            Alle Events werden in Echtzeit erfasst und persistent in der Supabase-Datenbank gespeichert.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
