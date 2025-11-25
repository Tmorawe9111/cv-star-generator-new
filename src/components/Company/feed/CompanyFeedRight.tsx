import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCompany } from "@/hooks/useCompany";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Briefcase, Users, Sparkles } from "lucide-react";
import { RightRailAd } from "@/components/linkedin/right-rail/RightRailAd";
import { CardHeader } from "@/components/ui/card";

const ACTIVE_STATUSES = new Set([
  "published",
  "active",
  "aktiv",
  "online",
  "live",
  "open",
]);

type ActiveJob = {
  id: string;
  title: string;
  city?: string | null;
  employment_type?: string | null;
  created_at: string;
};

type UnlockedCandidate = {
  id: string;
  vorname?: string | null;
  nachname?: string | null;
  ort?: string | null;
  avatar_url?: string | null;
  unlocked_at: string;
};

const sb: any = supabase;

const formatName = (candidate: UnlockedCandidate) => {
  const first = candidate.vorname?.trim();
  const last = candidate.nachname?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return "Kandidat";
};

const initialsFromCandidate = (candidate: UnlockedCandidate) => {
  const first = candidate.vorname?.trim()?.[0];
  const last = candidate.nachname?.trim()?.[0];
  const letters = `${first || ""}${last || ""}`.toUpperCase();
  return letters || "K";
};

const formatCity = (candidate: UnlockedCandidate) => candidate.ort?.trim() ?? "";

const formatJobMeta = (job: ActiveJob) =>
  [job.city, job.employment_type].filter(Boolean).join(" • ");

const formatRelativeDate = (date: string) => {
  const created = new Date(date);
  const now = new Date();
  const diff = Math.max(0, now.getTime() - created.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Neu";
  if (days === 1) return "Gestern";
  if (days < 7) return `${days} Tage`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} Wochen`;
  const months = Math.floor(days / 30);
  return `${months} Monate`;
};

const CompanyFeedRight: React.FC = () => {
  const { company } = useCompany();
  const navigate = useNavigate();

  const activeJobsQuery = useQuery<ActiveJob[]>({
    queryKey: ["company-feed-active-jobs", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await sb
        .from("job_posts")
        .select("id, title, city, employment_type, status, is_active, created_at")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("Error loading active jobs", error);
        return [];
      }

      return (
        data || []
      ).filter((job: any) => {
        if (job.is_active === true) return true;
        if (job.is_active === false) return false;
        const normalized = typeof job.status === "string" ? job.status.toLowerCase() : "";
        return ACTIVE_STATUSES.has(normalized);
      });
    },
  });

  const unlockedQuery = useQuery<UnlockedCandidate[]>({
    queryKey: ["company-feed-unlocked", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await sb
        .from("company_candidates")
        .select(
          `id, unlocked_at, profiles: candidate_id (id, vorname, nachname, ort, avatar_url)`
        )
        .eq("company_id", company.id)
        .not("unlocked_at", "is", null)
        .order("unlocked_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("Error loading unlocked candidates", error);
        return [];
      }

      return (data || [])
        .map((row: any) => ({
          id: row.profiles?.id || row.id,
          vorname: row.profiles?.vorname,
          nachname: row.profiles?.nachname,
          ort: row.profiles?.ort,
          avatar_url: row.profiles?.avatar_url,
          unlocked_at: row.unlocked_at,
        }))
        .filter((candidate: UnlockedCandidate) => !!candidate.id);
    },
  });

  return (
    <div className="company-feed-right space-y-4">
      <RightRailAd
        variant="card"
        size="sm"
        title="Unternehmensprofil stärken"
        description="Teile Einblicke, promote Jobs und erreiche Talente in deiner Community."
        ctaText="Beitrag erstellen"
        ctaHref="/company/feed"
      />

      <Card className="rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Briefcase className="h-4 w-4 text-primary" /> Aktive Stellen
        </div>
        {activeJobsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Lädt …
          </div>
        ) : (activeJobsQuery.data || []).length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Noch keine aktiven Stellen. <button className="underline" onClick={() => navigate("/company/jobs")}>Jetzt veröffentlichen</button>.
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobsQuery.data!.map((job) => (
              <div key={job.id} className="rounded-lg border bg-muted/40 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground line-clamp-2">
                      {job.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {formatJobMeta(job) || "Flexible Angaben"}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {formatRelativeDate(job.created_at)}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => navigate(`/company/jobs/${job.id}`)}
                >
                  Details ansehen
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => navigate("/company/jobs")}>Alle Stellen verwalten</Button>
      </Card>

      <Card className="rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4 text-primary" /> Zuletzt freigeschaltete Talente
        </div>
        {unlockedQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Lädt …
          </div>
        ) : (unlockedQuery.data || []).length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Noch keine neuen Freischaltungen. Nutze die Suche, um Talente zu entdecken.
          </div>
        ) : (
          <div className="space-y-3">
            {unlockedQuery.data!.map((candidate) => (
              <div key={candidate.id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {candidate.avatar_url ? (
                    <AvatarImage src={candidate.avatar_url} alt={formatName(candidate)} />
                  ) : null}
                  <AvatarFallback>{initialsFromCandidate(candidate)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">
                    {formatName(candidate)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {formatCity(candidate) || "Ort nicht angegeben"}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(`/company/profile/${candidate.id}`)}>
                  Profil
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => navigate("/company/unlocked")}>Pipeline öffnen</Button>
      </Card>

      <Card className="rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> Ressourcen für mehr Reichweite
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <button className="underline" onClick={() => navigate("/company/profile")}>Profil vervollständigen</button> – bessere Sichtbarkeit für Bewerber:innen.
          </li>
          <li>
            <button className="underline" onClick={() => navigate("/company/jobs")}>Job Spotlight planen</button> – hebe wichtige Stellen im Feed hervor.
          </li>
          <li>
            <button className="underline" onClick={() => navigate("/company/settings")}>Teammitglieder einladen</button> – Zusammenarbeit leicht gemacht.
          </li>
        </ul>
      </Card>

      <RightRailAd
        variant="banner"
        size="sm"
        title="Mehr Talente erreichen"
        description="Upgrade auf den Growth-Plan und schalte zusätzliche Promotion-Tools frei."
        ctaText="Mehr erfahren"
        ctaHref="/company/settings/billing"
      />
    </div>
  );
};

export default CompanyFeedRight;
