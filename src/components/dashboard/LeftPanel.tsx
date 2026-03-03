import React from "react";
import type { ProfileRow } from "@/types/profile";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { MapPin, Users, Trophy } from "lucide-react";
import { TopMatchedCandidates } from "./TopMatchedCandidates";
import { useCompany } from "@/hooks/useCompany";
import { useReferralCode } from "@/hooks/useReferralCode";
function firstWords(text?: string | null, n: number = 40) {
  if (!text) return null;
  const words = text.trim().split(/\s+/);
  const slice = words.slice(0, n).join(" ");
  return words.length > n ? `${slice}…` : slice;
}
function firstChars(text?: string | null, n: number = 40) {
  if (!text) return null;
  const trimmed = text.trim();
  return trimmed.length > n ? `${trimmed.slice(0, n)}…` : trimmed.slice(0, n);
}
function getAbout(profile: ProfileRow | null | undefined): string | null {
  if (!profile) return null;
  const p = profile as Record<string, unknown>;
  const val = p.ueber_mich ?? p.ueberMich ?? profile.uebermich ?? p.about ?? profile.bio ?? p.beschreibung ?? profile.motivation;
  return val != null && val !== "" ? String(val) : null;
}

function getDisplayName(profile: ProfileRow | null | undefined): string {
  if (!profile) return "Unbekannter Nutzer";
  if (profile.vorname && profile.nachname) {
    return `${profile.vorname} ${profile.nachname}`;
  }
  if (profile.vorname) return profile.vorname;
  if (profile.nachname) return profile.nachname;
  return "Unbekannter Nutzer";
}

function getDescription(profile: ProfileRow | null | undefined): string | null {
  if (!profile) return null;
  
  // Für Schüler: "Schüler [Branche] [Ort]"
  if (profile.status === 'schueler') {
    const parts = [];
    if (profile.status === 'schueler') parts.push('Schüler');
    if (profile.branche) parts.push(profile.branche);
    if (profile.ort) parts.push(profile.ort);
    return parts.length > 1 ? parts.join(' ') : null;
  }
  
  // Für Azubis: "Azubi [Beruf] @ [Betrieb]"
  if (profile.status === 'azubi') {
    const parts = [];
    if (profile.ausbildungsberuf) parts.push(profile.ausbildungsberuf);
    if (profile.ausbildungsbetrieb) parts.push(`@ ${profile.ausbildungsbetrieb}`);
    return parts.length > 0 ? parts.join(' ') : null;
  }
  
  // Für Ausgelernte: "[Beruf] @ [Betrieb]"
  if (profile.status === 'ausgelernt') {
    const parts = [];
    if (profile.aktueller_beruf) parts.push(profile.aktueller_beruf);
    if (profile.ausbildungsbetrieb) parts.push(`@ ${profile.ausbildungsbetrieb}`);
    return parts.length > 0 ? parts.join(' ') : null;
  }
  
  // Fallback: Über mich Text
  return getAbout(profile);
}
function getEmployerOrSchool(p: ProfileRow | null | undefined): string | null {
  if (!p) return null;
  if (p.status === 'schueler') {
    return p.schule || p.schulbildung?.[0]?.institution || null;
  }
  if (p.status === 'azubi' || p.status === 'ausgelernt') {
    const exp = (p.berufserfahrung as Array<{ bis?: string; unternehmen?: string }>) ?? [];
    const current = exp.find((job) => !job.bis || new Date(job.bis) > new Date());
    return current?.unternehmen ?? p.ausbildungsbetrieb ?? null;
  }
  return null;
}
export const LeftPanel: React.FC = () => {
  const {
    profile
  } = useAuth();
  const navigate = useNavigate();
  const { company } = useCompany();
  const { stats, isLoading: isLoadingReferrals } = useReferralCode();
  
  const displayName = getDisplayName(profile);
  const description = getDescription(profile);
  const about = getAbout(profile);
  return <aside aria-label="Profilübersicht" className="space-y-4">
      {/* Profilkarte mit Titelbild */}
      <Card className="p-0 overflow-hidden">
        {/* Cover + Avatar overlay */}
        <div className="relative">
          <img
            src={profile?.cover_image_url || profile?.cover_url || profile?.titelbild_url || '/images/step1-hero.jpg'}
            alt="Titelbild"
            className="h-24 w-full object-cover"
            loading="lazy"
          />
          <div className="absolute -bottom-7 left-5">
            <Avatar className="h-16 w-16 ring-2 ring-background shadow">
              <AvatarImage src={profile?.avatar_url || undefined} alt={`${profile?.vorname ?? 'Unbekannt'} Avatar`} />
              <AvatarFallback>
                {profile?.vorname && profile?.nachname ? `${profile.vorname[0]}${profile.nachname[0]}` : "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pt-10 pb-5">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold leading-tight truncate">
              {displayName}
            </h2>
            {description && <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{description}</p>}
            {(profile?.ort || profile?.branche || getEmployerOrSchool(profile)) && <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden />
                <span>
                  {profile?.ort || '—'}
                  {profile?.branche && ' • '}<>{profile?.branche}</>
                  {getEmployerOrSchool(profile) && ' • '}<>{getEmployerOrSchool(profile) ?? ''}</>
                </span>
              </div>}
          </div>

        </div>
      </Card>

      {/* Statistik-Karte wie im Screenshot */}
      <Card className="p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Profilbesuche</span>
            <span className="text-sm font-semibold text-primary">295</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Impressions von Beiträgen</span>
            <span className="text-sm font-semibold text-primary">102</span>
          </div>
          <hr className="my-2 border-border" />
          <div className="flex items-center justify-between">
            <Button variant="link" className="px-0" onClick={() => navigate('/profile')}>
              Zum Profil
            </Button>
          </div>
        </div>
      </Card>

      {/* Referral Widget */}
      {profile && !company && (
        <Card className="p-5 border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Einladungen</span>
              </div>
              {!isLoadingReferrals && stats && (
                <div className="flex items-center gap-2">
                  {stats.is_contest_eligible && (
                    <Trophy className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-sm font-semibold text-primary">
                    {stats.successful_referrals}
                  </span>
                </div>
              )}
            </div>
            {!isLoadingReferrals && stats && stats.is_contest_eligible && (
              <Badge className="w-full justify-center bg-primary text-primary-foreground">
                Teilnahmeberechtigt für Gewinnspiel!
              </Badge>
            )}
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={() => navigate('/referrals')}
            >
              Code teilen & gewinnen
            </Button>
          </div>
        </Card>
      )}

      {/* Schnellaktionen: Jobvorschläge */}
      <Card className="p-5">
        <h3 className="text-sm font-medium mb-3">Schnellaktionen</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate('/marketplace')}>
            Jobvorschläge
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/marketplace')}>
            Trend‑Jobs
          </Button>
        </div>
      </Card>

      {/* Top Matched Candidates */}
      {company && (
        <TopMatchedCandidates companyId={company.id} />
      )}

      {/* Schnellzugriff */}
      <Card className="p-5">
        <h3 className="text-sm font-medium mb-3">Schnellzugriff</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Mein Netzwerk</li>
          <li>• Gespeicherte Beiträge</li>
          <li>• Benachrichtigungen</li>
        </ul>
      </Card>
    </aside>;
};
export default LeftPanel;