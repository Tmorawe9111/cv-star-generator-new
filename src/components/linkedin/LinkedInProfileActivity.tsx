import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, PenSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { openPostComposer } from '@/lib/event-bus';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ProfilePostsSection } from '@/components/profile/ProfilePostsSection';

interface ActivityPost {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  user_id: string;
  author?: {
    id: string;
    vorname?: string;
    nachname?: string;
    avatar_url?: string;
    ausbildungsberuf?: string;
  };
}

interface LinkedInProfileActivityProps {
  profile: any;
}

export const LinkedInProfileActivity: React.FC<LinkedInProfileActivityProps> = ({ profile }) => {
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const isOwner = user?.id === profile?.id;
  const [prefOpen, setPrefOpen] = useState(false);

  // Für eigenes Profil: verwende authProfile (hat alle Felder)
  // Für fremdes Profil: verwende übergebenes profile
  const displayProfile = isOwner && authProfile ? authProfile : profile;

  // Check if current user is a company user
  const { data: companyUser } = useQuery({
    queryKey: ['company-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2 md:pb-3">
        <CardTitle className="text-lg font-semibold">Aktivitäten</CardTitle>
        {isOwner && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={openPostComposer}>
              <PenSquare className="h-4 w-4 mr-2" />
              Beitrag erstellen
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPrefOpen(true)} title="Einstellungen">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {/* Check if company user can view posts */}
        {companyUser?.company_id ? (
          // Company user - check follow relationship
          <ProfilePostsSection
            profileId={profile.id}
            isOwner={isOwner}
            isCompany={true}
            companyId={companyUser.company_id}
          />
        ) : (
          // Regular user or no company
          <ProfilePostsSection
            profileId={profile.id}
            isOwner={isOwner}
            isCompany={false}
          />
        )}
      </CardContent>

      {isOwner && (
        <Dialog open={prefOpen} onOpenChange={setPrefOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Welche Inhalte möchten Sie zuerst zeigen?</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground mb-4">Ihre letzten Aktivitäten zeigen nur Inhalte der letzten 360 Tage.</div>
            <RadioGroup defaultValue="posts" className="space-y-3">
              {[
                { value: 'posts', label: 'Beiträge' },
                { value: 'comments', label: 'Kommentare' },
                { value: 'videos', label: 'Videos', hint: 'Nichts im vergangenen Jahr gepostet' },
                { value: 'images', label: 'Bilder', hint: 'Nichts im vergangenen Jahr gepostet' },
                { value: 'articles', label: 'Artikel', hint: 'Nichts im vergangenen Jahr gepostet' },
                { value: 'newsletter', label: 'Newsletter', hint: 'Nichts im vergangenen Jahr gepostet' },
                { value: 'events', label: 'Events', hint: 'Nichts im vergangenen Jahr gepostet' },
                { value: 'docs', label: 'Dokumente', hint: 'Nichts im vergangenen Jahr gepostet' },
              ].map((o) => (
                <div key={o.value} className="flex items-center gap-3">
                  <RadioGroupItem id={`pref-${o.value}`} value={o.value} />
                  <Label htmlFor={`pref-${o.value}`} className="flex-1 cursor-pointer">
                    {o.label}
                    {o.hint && <span className="ml-2 text-muted-foreground">({o.hint})</span>}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setPrefOpen(false)}>Speichern</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};
