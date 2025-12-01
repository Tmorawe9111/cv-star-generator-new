import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Kpis = {
  // User Metrics
  newUsers: number; // Neue User mit Profil (letzte 30 Tage)
  totalUsers: number; // Gesamt User mit Profil
  completeProfiles: number; // Vervollständigte Profile
  
  // CV Generator Metrics
  cvGeneratorClicks: number; // Klicks auf "Registrieren/CV Generator"
  cvStepCompletions: Record<number, number>; // Step-Completion-Rates
  cvErrors: number; // Fehlermeldungen (Download, etc.)
  cvAbandonments: number; // Abbrüche im CV Generator
  
  // Company Metrics
  newCompanies: number; // Neue Unternehmen (letzte 30 Tage)
  completeCompanyProfiles: number; // Vervollständigte Unternehmensprofile
  
  // Engagement Metrics
  dauUsers: number; // Daily Active Users
  dauCompanies: number; // Daily Active Companies
  unlockedProfiles: number; // Entsperrte Profile
};

function getDateRange(range: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (range) {
    case 'last_7_days':
      start.setDate(start.getDate() - 7);
      break;
    case 'last_30_days':
      start.setDate(start.getDate() - 30);
      break;
    case 'last_90_days':
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  
  return { start, end };
}

export function useKpis(range: string = 'last_30_days') {
  return useQuery({
    queryKey: ["kpis", range],
    queryFn: async () => {
      const { start, end } = getDateRange(range);
      
      // 1. User Metrics
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      const { count: completeProfiles } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('profile_complete', true);
      
      // 2. CV Generator Metrics
      const { data: cvClicks } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'button_click')
        .or('button_label.ilike.%CV Generator%,button_label.ilike.%Registrieren%,button_label.ilike.%CV%')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      const { data: cvSteps } = await supabase
        .from('analytics_events')
        .select('metadata')
        .eq('event_type', 'cv_step')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      const { count: cvErrors } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'cv_error')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      const { count: cvAbandonments } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'cv_abandonment')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      // Calculate step completions
      const stepCompletions: Record<number, number> = {};
      cvSteps?.forEach((event: any) => {
        const step = event.metadata?.step;
        if (step !== undefined) {
          stepCompletions[step] = (stepCompletions[step] || 0) + 1;
        }
      });
      
      // 3. Company Metrics
      const { count: totalCompanies } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });
      
      const { count: newCompanies } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      const { count: completeCompanyProfiles } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('onboarding_completed', true);
      
      // 4. Engagement Metrics (simplified - would need proper tracking)
      const { count: dauUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const { count: dauCompanies } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const { count: unlockedProfiles } = await supabase
        .from('profile_unlocks')
        .select('*', { count: 'exact', head: true })
        .gte('unlocked_at', start.toISOString())
        .lte('unlocked_at', end.toISOString());
      
      return {
        newUsers: newUsers || 0,
        totalUsers: totalUsers || 0,
        completeProfiles: completeProfiles || 0,
        cvGeneratorClicks: cvClicks?.length || 0,
        cvStepCompletions: stepCompletions,
        cvErrors: cvErrors || 0,
        cvAbandonments: cvAbandonments || 0,
        newCompanies: newCompanies || 0,
        completeCompanyProfiles: completeCompanyProfiles || 0,
        dauUsers: dauUsers || 0,
        dauCompanies: dauCompanies || 0,
        unlockedProfiles: unlockedProfiles || 0,
      } as Kpis;
    },
    staleTime: 60_000, // 1 minute
  });
}
