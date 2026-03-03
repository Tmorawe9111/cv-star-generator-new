import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanyUserRole, isCompanyAdminRole, type CompanyUserRole } from "@/hooks/useCompanyUserRole";
import { MultiSelect, type Option as MultiSelectOption } from "@/components/ui/multi-select";
import { useAuth } from "@/hooks/useAuth";
import { PLANS, type PlanKey } from "@/lib/billing-v2/plans";

interface TeamMemberRow {
  id: string;
  user_id: string | null;
  role: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  profile?: {
    vorname?: string | null;
    nachname?: string | null;
    email?: string | null;
    telefon?: string | null;
    avatar_url?: string | null;
  } | null;
}

export default function CompanySettingsTeam() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company, companyUser, loading } = useCompany();
  const { user } = useAuth();
  const { data: myRole } = useCompanyUserRole(company?.id);

  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CompanyUserRole>("recruiter");
  const [busy, setBusy] = useState(false);
  const [invites, setInvites] = useState<Array<{ id: string; email: string; role: string; invited_at: string; invite_token: string | null }>>([]);
  const [allowedDomain, setAllowedDomain] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; status?: string | null; is_active?: boolean | null }>>([]);
  const [assignmentsByRecruiter, setAssignmentsByRecruiter] = useState<Record<string, string[]>>({});
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>("");
  const [selectedRecruiterJobIds, setSelectedRecruiterJobIds] = useState<string[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsSaving, setAssignmentsSaving] = useState(false);
  const [activePlanSeats, setActivePlanSeats] = useState<number | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [transferToUserId, setTransferToUserId] = useState<string>("");
  const [transferBusy, setTransferBusy] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);

  const seatsTotal = useMemo(() => {
    // Prefer active plan assignment seats; fallback to plan defaults; then company fields; min 1
    if (typeof activePlanSeats === "number" && activePlanSeats > 0) return activePlanSeats;
    const planKey = ((activePlanId || (company as any)?.active_plan_id || (company as any)?.plan_name || (company as any)?.selected_plan_id || "free") as PlanKey);
    const plan = PLANS[planKey] || PLANS["free"];
    const planSeats = plan?.seatsIncluded ?? null;
    if (typeof planSeats === "number" && planSeats > 0) return planSeats;
    const v = (company as any)?.max_seats ?? (company as any)?.seats ?? (company as any)?.seats_included ?? 0;
    return typeof v === "number" && v > 0 ? v : 1;
  }, [activePlanId, activePlanSeats, company]);

  const seatsUsed = useMemo(() => {
    const accepted = new Set(
      members
        .filter((m) => !!m.accepted_at && !!m.user_id)
        .map((m) => m.user_id as string),
    );
    if (user?.id) accepted.add(user.id);
    return Math.max(1, accepted.size);
  }, [members, user?.id]);

  const roleLabel = (role: CompanyUserRole) => {
    if (role === "owner") return "Superadmin";
    if (role === "admin") return "Admin";
    if (role === "recruiter") return "Recruiter";
    if (role === "viewer") return "Betrachter";
    if (role === "marketing") return "Marketing";
    return role;
  };

  const load = async () => {
    if (!company?.id) return;
    const { data, error } = await supabase
      .from("company_users")
      .select("id, user_id, role, invited_at, accepted_at")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });
    if (error) return;
    const rows = (data as TeamMemberRow[]) || [];

    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
    let profileMap = new Map<string, TeamMemberRow["profile"]>();
    if (userIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, vorname, nachname, email, telefon, avatar_url")
        .in("id", userIds);
      if (profileRows) {
        profileMap = new Map(
          (profileRows as any[]).map((p) => [
            p.id,
            {
              vorname: p.vorname ?? null,
              nachname: p.nachname ?? null,
              email: p.email ?? null,
              telefon: p.telefon ?? null,
              avatar_url: p.avatar_url ?? null,
            },
          ]),
        );
      }
    }

    setMembers(
      rows.map((r) => ({
        ...r,
        profile: r.user_id ? profileMap.get(r.user_id) ?? null : null,
      })),
    );

    // Domain fallback: derive from primary_email (works even if allowed_email_domain column doesn't exist yet)
    const primaryEmail = (company as any)?.primary_email as string | null | undefined;
    const derived = primaryEmail && primaryEmail.includes("@") ? primaryEmail.split("@")[1]?.toLowerCase() : null;
    setAllowedDomain(derived ?? null);

    // Seats should come from plan assignment (if available)
    try {
      const { data: planData } = await supabase.rpc("get_active_company_plan", { p_company_id: company.id });
      const active = (planData as any[])?.[0] || null;
      setActivePlanSeats(typeof active?.seats === "number" ? active.seats : null);
      setActivePlanId(active?.plan_id ?? null);
    } catch {
      setActivePlanSeats(null);
      setActivePlanId(null);
    }

    // pending invites (superadmin only)
    if (myRole === "owner") {
      const { data: invData } = await supabase
        .from("company_invites" as any)
        .select("id, email, role, invited_at, invite_token, accepted_at, revoked_at")
        .eq("company_id", company.id)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .order("invited_at", { ascending: false });
      setInvites((invData as any[])?.map((x) => ({
        id: x.id,
        email: x.email,
        role: x.role,
        invited_at: x.invited_at,
        invite_token: x.invite_token ?? null,
      })) ?? []);

      // job list + assignments (superadmin only)
      setAssignmentsLoading(true);
      try {
        const { data: jobRows, error: jobErr } = await supabase
          .from("job_posts")
          .select("id, title, status, is_active")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false });
        if (!jobErr) {
          setJobs((jobRows as any[])?.map((j) => ({
            id: j.id,
            title: j.title,
            status: j.status ?? null,
            is_active: j.is_active ?? null,
          })) ?? []);
        }

        const { data: aRows, error: aErr } = await (supabase as any)
          .from("company_job_assignments")
          .select("recruiter_user_id, job_id")
          .eq("company_id", company.id);
        if (!aErr) {
          const map: Record<string, string[]> = {};
          (aRows as any[] || []).forEach((r) => {
            const rid = r.recruiter_user_id as string;
            const jid = r.job_id as string;
            if (!rid || !jid) return;
            if (!map[rid]) map[rid] = [];
            map[rid].push(jid);
          });
          setAssignmentsByRecruiter(map);
        }
      } finally {
        setAssignmentsLoading(false);
      }
    } else {
      setInvites([]);
      setJobs([]);
      setAssignmentsByRecruiter({});
    }
  };

  useEffect(() => {
    load();
  }, [company?.id, myRole]);

  // sync selected recruiter job ids from map
  useEffect(() => {
    if (!selectedRecruiterId) {
      setSelectedRecruiterJobIds([]);
      return;
    }
    setSelectedRecruiterJobIds(assignmentsByRecruiter[selectedRecruiterId] ?? []);
  }, [selectedRecruiterId, assignmentsByRecruiter]);

  const invite = async () => {
    if (!company?.id) return;
    if (!email.trim()) return;
    setBusy(true);
    try {
      if (myRole !== "owner") {
        toast({ title: "Keine Berechtigung", description: "Nur Superadmin kann Teammitglieder einladen.", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.rpc("invite_company_user_by_email", {
        p_company_id: company.id,
        p_email: email.trim(),
        p_role: inviteRole,
      });
      if (error) throw error;
      if (!(data as any)?.success) {
        toast({ title: "Fehler", description: (data as any)?.message || "Einladung fehlgeschlagen.", variant: "destructive" });
        return;
      }

      const token = (data as any)?.invite_token as string | undefined;
      const link = token ? `${window.location.origin}/auth?company_invite=${encodeURIComponent(token)}` : null;
      let copySuccess = true;
      if (link) {
        copySuccess = await navigator.clipboard.writeText(link).then(() => true).catch(() => false);
      }
      toast({
        title: "Einladung erstellt",
        description: link
          ? (copySuccess ? "Einladungslink wurde kopiert." : "Link konnte nicht kopiert werden. Bitte kopieren Sie den Link manuell.")
          : "Einladung wurde erstellt.",
        variant: copySuccess ? "default" : "destructive",
      });
      setEmail("");
      await load();
    } catch (e: any) {
      toast({
        title: "Fehler",
        description: e?.message || "Konnte nicht einladen.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    if (!company?.id) return;
    if (myRole !== "owner") return;
    setBusy(true);
    try {
      const { error } = await (supabase as any)
        .from("company_invites")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", inviteId)
        .eq("company_id", company.id);
      if (error) throw error;
      toast({ title: "Einladung widerrufen" });
      await load();
    } catch (e: any) {
      toast({ title: "Fehler", description: e?.message || "Konnte Einladung nicht widerrufen.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (memberId: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.from("company_users").delete().eq("id", memberId);
      if (error) throw error;
      toast({ title: "Entfernt", description: "Teammitglied wurde entfernt." });
      await load();
    } catch (e: any) {
      toast({
        title: "Fehler",
        description: e?.message || "Konnte nicht entfernen.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const updateRole = async (memberId: string, role: CompanyUserRole) => {
    if (!company?.id) return;
    if (myRole !== "owner") return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("company_users")
        .update({ role })
        .eq("id", memberId)
        .eq("company_id", company.id);
      if (error) throw error;
      toast({ title: "Rolle aktualisiert" });
      await load();
    } catch (e: any) {
      toast({ title: "Fehler", description: e?.message || "Konnte Rolle nicht aktualisieren.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const superadminMember = useMemo(() => {
    return members.find((m) => (m.role || "").toLowerCase() === "owner" && !!m.accepted_at);
  }, [members]);

  const superadminName = useMemo(() => {
    if (!superadminMember) return null;
    return (
      [superadminMember.profile?.vorname, superadminMember.profile?.nachname].filter(Boolean).join(" ") ||
      superadminMember.profile?.email ||
      superadminMember.user_id
    );
  }, [superadminMember]);

  const transferableUsers = useMemo(() => {
    // Allow transfer to an accepted admin only (per requirement)
    return members
      .filter((m) => !!m.accepted_at && !!m.user_id)
      .filter((m) => (m.role || "").toLowerCase() === "admin")
      .map((m) => ({
        userId: m.user_id as string,
        label:
          [m.profile?.vorname, m.profile?.nachname].filter(Boolean).join(" ") ||
          m.profile?.email ||
          (m.user_id as string),
      }))
      .filter((x) => x.userId !== superadminMember?.user_id);
  }, [members, superadminMember?.user_id]);

  const canClaimOwner = useMemo(() => {
    const myEmail = (user as any)?.email || "";
    const primary = (company as any)?.primary_email || "";
    if (!myEmail || !primary) return false;
    // If the logged-in email matches primary_email, allow recovery even if role/accepted_at is borked.
    // The RPC itself enforces the same rule and will no-op with a message if it doesn't match.
    if (String(myEmail).toLowerCase() !== String(primary).toLowerCase()) return false;
    return !!companyUser?.id; // we have a membership row (how company is resolved in this app)
  }, [user, company, companyUser?.id]);

  const transferSuperadmin = async () => {
    if (!company?.id) return;
    if (myRole !== "owner") return;
    if (!transferToUserId) {
      toast({ title: "Admin auswählen", description: "Bitte wählen Sie einen Admin aus.", variant: "destructive" });
      return;
    }
    setTransferBusy(true);
    try {
      const { data, error } = await (supabase as any).rpc("transfer_company_owner", {
        p_company_id: company.id,
        p_new_owner_user_id: transferToUserId,
      });
      if (error) throw error;
      if (data?.success !== true) {
        throw new Error(data?.message || "Konnte Superadmin nicht übertragen.");
      }

      toast({ title: "Superadmin übertragen", description: "Die Rolle wurde übertragen." });
      setTransferToUserId("");
      await load();
    } catch (e: any) {
      toast({ title: "Fehler", description: e?.message || "Konnte Superadmin nicht übertragen.", variant: "destructive" });
    } finally {
      setTransferBusy(false);
    }
  };

  const claimSuperadmin = async () => {
    if (!company?.id) return;
    if (!canClaimOwner) return;
    setClaimBusy(true);
    try {
      const { data, error } = await (supabase as any).rpc("claim_company_owner", {
        p_company_id: company.id,
      });
      if (error) throw error;
      if (data?.success !== true) {
        throw new Error(data?.message || "Superadmin konnte nicht wiederhergestellt werden.");
      }
      toast({ title: "Superadmin wiederhergestellt", description: "Du bist jetzt Superadmin dieses Unternehmens." });
      await load();
    } catch (e: any) {
      toast({ title: "Fehler", description: e?.message || "Superadmin konnte nicht wiederhergestellt werden.", variant: "destructive" });
    } finally {
      setClaimBusy(false);
    }
  };

  const recruiterOptions = useMemo(() => {
    return members
      .filter((m) => !!m.accepted_at && !!m.user_id)
      .filter((m) => (m.role || "").toLowerCase() === "recruiter")
      .map((m) => {
        const name = [m.profile?.vorname, m.profile?.nachname].filter(Boolean).join(" ") || m.profile?.email || m.user_id!;
        return { userId: m.user_id!, label: name, email: m.profile?.email ?? null };
      });
  }, [members]);

  const jobOptions: MultiSelectOption[] = useMemo(() => {
    return (jobs || []).map((j) => {
      const status = (j.status || "").toLowerCase();
      const archived = status === "inactive" || status === "deleted" || j.is_active === false;
      return {
        value: j.id,
        label: archived ? `${j.title} (archiviert)` : j.title,
      };
    });
  }, [jobs]);

  const saveAssignments = async () => {
    if (!company?.id) return;
    if (!selectedRecruiterId) {
      toast({ title: "Recruiter auswählen", description: "Bitte wählen Sie zuerst einen Recruiter aus.", variant: "destructive" });
      return;
    }
    if (myRole !== "owner") {
      toast({ title: "Keine Berechtigung", description: "Nur Superadmin kann Job-Zuweisungen verwalten.", variant: "destructive" });
      return;
    }
    setAssignmentsSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const assignedBy = authData.user?.id ?? null;

      // Replace assignments for recruiter
      const { error: delErr } = await (supabase as any)
        .from("company_job_assignments")
        .delete()
        .eq("company_id", company.id)
        .eq("recruiter_user_id", selectedRecruiterId);
      if (delErr) throw delErr;

      if (selectedRecruiterJobIds.length > 0) {
        const payload = selectedRecruiterJobIds.map((jobId) => ({
          company_id: company.id,
          job_id: jobId,
          recruiter_user_id: selectedRecruiterId,
          assigned_by: assignedBy,
        }));
        const { error: insErr } = await (supabase as any).from("company_job_assignments").insert(payload);
        if (insErr) throw insErr;
      }

      setAssignmentsByRecruiter((prev) => ({ ...prev, [selectedRecruiterId]: [...selectedRecruiterJobIds] }));
      toast({ title: "Gespeichert", description: "Job-Zuweisungen wurden aktualisiert." });
    } catch (e: any) {
      toast({ title: "Fehler", description: e?.message || "Konnte nicht speichern.", variant: "destructive" });
    } finally {
      setAssignmentsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!company) {
    return <div className="p-6 text-center text-muted-foreground">Kein Unternehmen gefunden.</div>;
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/unternehmen/einstellungen")}
          className="-ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zu Einstellungen
        </Button>

        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
              <Users className="h-5 w-5 text-slate-700" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Team & Sitze</h1>
              <p className="text-muted-foreground">
                Benutzer (Sitze) zugewiesen: <strong>{seatsUsed}</strong> / <strong>{seatsTotal}</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Superadmin: <strong>{superadminName ?? "nicht gesetzt (Support nötig)"}</strong>
              </p>
              {canClaimOwner ? (
                <div className="mt-2">
                  <Button type="button" variant="secondary" disabled={claimBusy} onClick={claimSuperadmin}>
                    {claimBusy ? "Stelle wieder her…" : "Superadmin wiederherstellen"}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Du bist als Admin eingeloggt mit der Primär‑E‑Mail dieses Unternehmens – damit kannst du den Superadmin zurückholen.
                  </p>
                </div>
              ) : null}
              {allowedDomain ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Nur Unternehmens-E-Mails erlaubt: <span className="font-mono">@{allowedDomain}</span>
                </p>
              ) : null}
            </div>
            <Badge variant="secondary">{seatsTotal} Sitze</Badge>
          </div>
        </header>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Rollen & Berechtigungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
              <p className="font-medium">Kurz erklärt:</p>
              <ul className="mt-2 space-y-1">
                <li><strong>Superadmin</strong> (Account, mit dem ihr eingeloggt seid): Plan upgraden, Sitze hinzufügen, Team/Rollen & Zuweisungen verwalten.</li>
                <li><strong>Admin</strong>: Sieht alle Freischaltungen, kann Stellenanzeigen veröffentlichen/pausieren, kann Tokens nachkaufen.</li>
                <li><strong>Recruiter</strong>: Arbeitet mit zugewiesenen Stellenanzeigen, kann Tokens nachkaufen.</li>
                <li><strong>Betrachter</strong>: Kann nur bereits freigeschaltete Profile ansehen und kontaktieren (z.B. anrufen).</li>
                <li><strong>Marketing</strong>: Nur Community (Posten/Kommentieren/Liken im Namen des Unternehmens).</li>
              </ul>
            </div>

            {myRole === "owner" ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="font-medium text-slate-900">Superadmin übertragen (nur 1 möglich)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Nur an einen bestehenden <strong>Admin</strong>. Danach hat der aktuelle Superadmin nur noch Admin‑Rechte.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                  <Select value={transferToUserId} onValueChange={setTransferToUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Admin auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {transferableUsers.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          Kein weiterer Admin vorhanden
                        </SelectItem>
                      ) : (
                        transferableUsers.map((u) => (
                          <SelectItem key={u.userId} value={u.userId}>
                            {u.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    disabled={!transferToUserId || transferToUserId === "__none" || transferBusy}
                    onClick={transferSuperadmin}
                  >
                    {transferBusy ? "Übertrage…" : "Übertragen"}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Teammitglied einladen</span>
              <Button
                variant="outline"
                onClick={() => navigate("/unternehmen/abrechnung?open=manage")}
                disabled={myRole !== "owner"}
              >
                Sitze verwalten
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {myRole !== "owner" ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                Nur <strong>Superadmin</strong> kann Teammitglieder einladen, Rollen verwalten, Sitze hinzufügen oder den Plan upgraden.
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-center">
            <Input
              placeholder="E‑Mail (muss zur Unternehmensdomain passen)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as CompanyUserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Rolle auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="viewer">Betrachter</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={invite} disabled={busy || !email.trim() || myRole !== "owner"}>
              <Plus className="h-4 w-4 mr-2" />
              Einladen
            </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Hinweis: Der Einladungslink wird nach dem Erstellen automatisch kopiert. Der eingeladene User muss sich mit derselben E‑Mail einloggen und den Link öffnen.
            </p>
          </CardContent>
        </Card>

        {myRole === "owner" && invites.length > 0 ? (
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Ausstehende Einladungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Rolle: <span className="font-medium">{inv.role}</span> · eingeladen am{" "}
                      {inv.invited_at ? new Date(inv.invited_at).toLocaleDateString("de-DE") : "—"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {inv.invite_token ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const link = `${window.location.origin}/auth?company_invite=${encodeURIComponent(inv.invite_token)}`;
                          await navigator.clipboard.writeText(link);
                          toast({ title: "Link kopiert" });
                        }}
                      >
                        Link kopieren
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" onClick={() => revokeInvite(inv.id)} disabled={busy}>
                      Widerrufen
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {myRole === "owner" ? (
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Stellenanzeigen zuweisen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Weisen Sie Recruitern bestimmte Stellenanzeigen zu. Recruiter sehen dann nur diese Jobs (und zugehörige Kandidaten) in Jobs, Dashboard, Pipeline und Freigeschaltet.
              </p>

              {assignmentsLoading ? (
                <div className="text-sm text-muted-foreground">Lade Zuweisungen…</div>
              ) : recruiterOptions.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  Noch keine Recruiter im Team. Setzen Sie zuerst die Rolle eines Teammitglieds auf <strong>Recruiter</strong>.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">Recruiter</p>
                    <Select value={selectedRecruiterId} onValueChange={setSelectedRecruiterId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Recruiter auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {recruiterOptions.map((r) => (
                          <SelectItem key={r.userId} value={r.userId}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedRecruiterId ? (
                      <p className="text-xs text-muted-foreground">
                        Aktuell zugewiesen: <strong>{(assignmentsByRecruiter[selectedRecruiterId] || []).length}</strong> Jobs
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">Jobs</p>
                    <MultiSelect
                      options={jobOptions}
                      selected={selectedRecruiterJobIds}
                      onChange={setSelectedRecruiterJobIds}
                      placeholder={selectedRecruiterId ? "Jobs auswählen…" : "Erst Recruiter auswählen"}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        disabled={!selectedRecruiterId || assignmentsSaving}
                        onClick={() => setSelectedRecruiterJobIds(jobOptions.map((o) => o.value))}
                      >
                        Alle zuweisen
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        disabled={!selectedRecruiterId || assignmentsSaving}
                        onClick={saveAssignments}
                      >
                        {assignmentsSaving ? "Speichern…" : "Speichern"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tipp: Wenn ein Recruiter <em>keine</em> Zuweisungen hat, sieht er aktuell weiterhin alle Jobs (Rollout-safe Default).
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">Noch keine Teammitglieder.</div>
            ) : (
              members.map((m) => {
                const isMe = !!user?.id && !!m.user_id && m.user_id === user.id;
                const meName =
                  [(user as any)?.user_metadata?.first_name, (user as any)?.user_metadata?.last_name]
                    .filter(Boolean)
                    .join(" ") || null;
                const name =
                  [m.profile?.vorname, m.profile?.nachname].filter(Boolean).join(" ") ||
                  (isMe ? meName || "Du" : null) ||
                  (m.user_id ? "Teammitglied" : "Einladung (ausstehend)");
                const sub =
                  m.profile?.email ||
                  (isMe ? ((user as any)?.email as string | undefined) : undefined) ||
                  (m.user_id ? "—" : "Noch nicht angenommen");
                const phone = m.profile?.telefon || null;
                const role = (m.role || "viewer").toLowerCase() as CompanyUserRole;
                const canManageTeam = myRole === "owner";
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {m.profile?.avatar_url ? <AvatarImage src={m.profile.avatar_url} alt={name} /> : null}
                        <AvatarFallback>
                          {(m.profile?.vorname?.[0] || "U") + (m.profile?.nachname?.[0] || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{name}</p>
                          {isMe ? <Badge variant="default">Du</Badge> : null}
                          {m.accepted_at ? <Badge variant="secondary">aktiv</Badge> : <Badge variant="outline">ausstehend</Badge>}
                          <Badge variant="outline">{roleLabel(role)}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {sub}
                          {phone ? <span> · {phone}</span> : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageTeam ? (
                        <Select
                          value={role}
                          onValueChange={(v) => updateRole(m.id, v as CompanyUserRole)}
                          disabled={busy || !m.accepted_at}
                        >
                          <SelectTrigger className="h-9 w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner" disabled>
                              Superadmin (nur Support)
                            </SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="recruiter">Recruiter</SelectItem>
                            <SelectItem value="viewer">Betrachter</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(m.id)}
                        disabled={busy || myRole !== "owner" || role === "owner"}
                        title={myRole !== "owner" ? "Nur Superadmin" : "Entfernen"}
                      >
                        <Trash2 className="h-4 w-4 text-slate-600" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


