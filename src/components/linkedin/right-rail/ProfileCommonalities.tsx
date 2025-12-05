import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, Heart, Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CommonalitiesBadge } from '@/components/marketplace/CommonalitiesBadge';

interface ProfileCommonalitiesProps {
  profileId: string;
}

export function ProfileCommonalities({ profileId }: ProfileCommonalitiesProps) {
  const { user } = useAuth();

  const commonalitiesQuery = useQuery({
    queryKey: ['profile-commonalities', profileId, user?.id],
    queryFn: async () => {
      if (!user?.id || user.id === profileId) return null;

      // Load current user's data for comparison
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('id, berufserfahrung, schulbildung')
        .eq('id', user.id)
        .single();

      const { data: profileUser } = await supabase
        .from('profiles')
        .select('id, berufserfahrung, schulbildung')
        .eq('id', profileId)
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

      // Find mutual connections
      const { data: profileConnections } = await supabase
        .from('connections')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`)
        .eq('status', 'accepted');

      const profileConnectionIds = new Set(
        (profileConnections || []).map(c =>
          c.requester_id === profileId ? c.addressee_id : c.requester_id
        )
      );

      const mutualIds = Array.from(currentUserConnectionIds).filter(id =>
        profileConnectionIds.has(id) && id !== profileId && id !== user.id
      );

      let mutualConnections: Array<{ id: string; avatar_url: string | null; name: string }> = [];
      if (mutualIds.length > 0) {
        const { data: mutualProfiles } = await supabase
          .from('profiles')
          .select('id, vorname, nachname, avatar_url')
          .in('id', mutualIds.slice(0, 3));

        mutualConnections = (mutualProfiles || []).map(p => ({
          id: p.id,
          avatar_url: p.avatar_url,
          name: `${p.vorname || ''} ${p.nachname || ''}`.trim() || 'Unbekannt'
        }));
      }

      // Find common schools
      let commonSchools: string[] = [];
      if (currentUser?.schulbildung && profileUser?.schulbildung) {
        const currentSchools = Array.isArray(currentUser.schulbildung)
          ? currentUser.schulbildung.map((s: any) => s.name || s.schule).filter(Boolean)
          : [];
        const profileSchools = Array.isArray(profileUser.schulbildung)
          ? profileUser.schulbildung.map((s: any) => s.name || s.schule).filter(Boolean)
          : [];

        commonSchools = currentSchools.filter((school: string) =>
          profileSchools.some((ps: string) =>
            ps.toLowerCase().includes(school.toLowerCase()) ||
            school.toLowerCase().includes(ps.toLowerCase())
          )
        );
      }

      // Find common values
      let commonValues: string[] = [];
      if (currentUserValues) {
        try {
          const { data: profileValues, error: profileValuesError } = await supabase
            .from('user_values' as any)
            .select('*')
            .eq('user_id', profileId)
            .maybeSingle();

          // Ignore 406/400 errors (not found or RLS blocked) - user might not have values or access denied
          if (profileValues && !profileValuesError) {
            // Extract keywords from text answers for comparison
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
            
            // Simple matching: extract common keywords from answers
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
            
            commonValues = commonKeywords.slice(0, 3);
          }
        } catch (e) {
          // Silently ignore errors - user might not have values or RLS blocks access
          console.debug('Could not load profile values for comparison:', e);
        }
      }

      // Find common jobs (same position at different companies)
      let commonJobs: Array<{ company: string; position: string }> = [];
      if (currentUser?.berufserfahrung && profileUser?.berufserfahrung) {
        const currentJobs = Array.isArray(currentUser.berufserfahrung)
          ? currentUser.berufserfahrung.map((j: any) => ({
              position: j.position || j.beruf || j.titel,
              company: j.unternehmen || j.company
            })).filter((j: any) => j.position && j.company)
          : [];

        const profileJobs = Array.isArray(profileUser.berufserfahrung)
          ? profileUser.berufserfahrung.map((j: any) => ({
              position: j.position || j.beruf || j.titel,
              company: j.unternehmen || j.company
            })).filter((j: any) => j.position && j.company)
          : [];

        commonJobs = currentJobs.filter((currentJob: any) =>
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

      return {
        mutualConnections,
        mutualCount: mutualIds.length,
        commonSchools,
        commonValues,
        commonJobs
      };
    },
    enabled: !!user?.id && !!profileId && user.id !== profileId
  });

  if (!user || user.id === profileId) return null;
  if (commonalitiesQuery.isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gemeinsamkeiten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Lade...</div>
        </CardContent>
      </Card>
    );
  }

  const data = commonalitiesQuery.data;
  if (!data || (data.mutualCount === 0 && data.commonSchools.length === 0 && data.commonValues.length === 0 && data.commonJobs.length === 0)) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gemeinsamkeiten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground/70 italic">
            Gemeinsame Kontakte / Interesse (Werte)
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gemeinsamkeiten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CommonalitiesBadge
          mutualConnections={data.mutualConnections}
          mutualCount={data.mutualCount}
          commonSchools={data.commonSchools}
          commonValues={data.commonValues}
          commonJobs={data.commonJobs}
          type="person"
        />
      </CardContent>
    </Card>
  );
}

