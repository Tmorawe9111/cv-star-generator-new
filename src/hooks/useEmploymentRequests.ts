import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type EmploymentRequest = {
  id: string;
  user_id: string;
  company_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  confirmed_by?: string | null;
  company?: {
    id: string;
    name: string;
    logo_url?: string | null;
  };
  user_profile?: {
    id: string;
    vorname?: string | null;
    nachname?: string | null;
    headline?: string | null;
    avatar_url?: string | null;
  };
};

export function useEmploymentRequests(userId?: string) {
  return useQuery({
    queryKey: ["employment_requests", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: base, error } = await supabase
        .from("company_employment_requests")
        .select(`
          id,
          user_id,
          company_id,
          status,
          created_at,
          confirmed_by
        `)
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with company details (manual join to avoid PostgREST rel issues)
      const rows = (base as any[]) || [];
      if (rows.length === 0) return [] as any[];

      const companyIds = Array.from(new Set(rows.map(r => r.company_id).filter(Boolean)));
      let companyMap = new Map<string, any>();
      if (companyIds.length > 0) {
        const { data: companies, error: cErr } = await supabase
          .from("companies")
          .select("id, name, logo_url")
          .in("id", companyIds);
        if (cErr) console.error("Error loading companies for employment requests:", cErr);
        companyMap = new Map((companies || []).map((c: any) => [c.id, c]));
      }

      return rows.map(r => ({
        ...r,
        company: companyMap.get(r.company_id) || null,
      }));
    },
    staleTime: 30_000,
  });
}

export function useCompanyEmploymentRequests(companyId?: string) {
  return useQuery({
    queryKey: ["company_employment_requests", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data: base, error } = await supabase
        .from("company_employment_requests")
        .select(`
          id,
          user_id,
          company_id,
          status,
          created_at,
          confirmed_by
        `)
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (base as any[]) || [];
      if (rows.length === 0) return [] as any[];

      const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
      let profileMap = new Map<string, any>();
      if (userIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("id, vorname, nachname, headline, avatar_url")
          .in("id", userIds);
        if (pErr) console.error("Error loading profiles for employment requests:", pErr);
        profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      }

      return rows.map(r => ({
        ...r,
        user_profile: profileMap.get(r.user_id) || null,
      }));
    },
    staleTime: 30_000,
  });
}

export function useUpdateEmploymentRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: "accepted" | "declined" }) => {
      const {
        data: request,
        error: loadError,
      } = await supabase
        .from("company_employment_requests")
        .select("id, company_id, user_id")
        .eq("id", requestId)
        .maybeSingle();

      if (loadError) throw loadError;
      if (!request) throw new Error("Beschäftigungsanfrage wurde nicht gefunden");

      const currentUser = (await supabase.auth.getUser()).data.user?.id ?? null;

      let confirmedBy: string | null = null;
      if (currentUser) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", currentUser)
          .maybeSingle();
        if (profileRow?.id) {
          confirmedBy = profileRow.id;
        }
      }

      const updatePayload: Record<string, any> = { status };
      if (confirmedBy) {
        updatePayload.confirmed_by = confirmedBy;
      }

      const { error: updateError } = await supabase
        .from("company_employment_requests")
        .update(updatePayload)
        .eq("id", requestId);

      if (updateError) throw updateError;

      if (status === "accepted") {
        // prüfen ob schon Mitglied
        const { data: existing } = await supabase
          .from("company_users")
          .select("id")
          .eq("company_id", request.company_id)
          .eq("user_id", request.user_id)
          .maybeSingle();

        if (!existing) {
          // optional: Sitzlimit prüfen
          const [{ data: seatsInfo }, { count: memberCount }] = await Promise.all([
            supabase
              .from("companies")
              .select("seats")
              .eq("id", request.company_id)
              .maybeSingle(),
            supabase
              .from("company_users")
              .select("id", { count: "exact", head: true })
              .eq("company_id", request.company_id),
          ]);

          const seatLimit = seatsInfo?.seats ?? null;
          if (seatLimit != null && memberCount && memberCount >= seatLimit) {
            throw new Error("Sitzlimit erreicht. Bitte einen Sitz frei machen oder erhöhen.");
          }

          const { error: insertError } = await supabase.from("company_users").insert({
            company_id: request.company_id,
            user_id: request.user_id,
            role: "viewer",
            invited_at: new Date().toISOString(),
            accepted_at: new Date().toISOString(),
          });

          if (insertError) throw insertError;
        }
      } else if (status === "declined") {
        // Falls bereits ein Eintrag existiert, entfernen
        await supabase
          .from("company_users")
          .delete()
          .eq("company_id", request.company_id)
          .eq("user_id", request.user_id);
      }
    },
    onSuccess: () => {
      // Invalidate all related queries for live updates
      queryClient.invalidateQueries({ queryKey: ["employment_requests"] });
      queryClient.invalidateQueries({ queryKey: ["company_employment_requests"] });
      queryClient.invalidateQueries({ queryKey: ["profiles_public"] });
      queryClient.invalidateQueries({ queryKey: ["company_people_public"] });
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      queryClient.invalidateQueries({ queryKey: ["company-settings-team"] });

      toast.success("Anfrage erfolgreich bearbeitet");
    },
    onError: (error) => {
      console.error("Error updating employment request:", error);
      toast.error("Fehler beim Bearbeiten der Anfrage");
    },
  });
}