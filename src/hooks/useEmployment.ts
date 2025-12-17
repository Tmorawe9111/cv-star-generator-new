import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRequestEmployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ company_id }: { company_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("company_employment_requests")
        .insert([{ company_id, user_id: user.id }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myEmploymentRequests"] });
      toast.success("Anfrage gesendet");
    },
    onError: (e: any) => {
      const message = e.message?.includes("duplicate") 
        ? "Du hast bereits eine Anfrage für dieses Unternehmen gestellt"
        : e.message ?? "Konnte Anfrage nicht senden";
      toast.error(message);
    },
  });
}

export function useMyEmploymentRequests() {
  return useQuery({
    queryKey: ["myEmploymentRequests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("company_employment_requests")
        .select(`
          id, 
          company_id, 
          status, 
          created_at, 
          companies!company_employment_requests_company_id_fkey(name, logo_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCompanyPendingRequests(company_id: string | null) {
  return useQuery({
    enabled: !!company_id,
    queryKey: ["companyPendingRequests", company_id],
    queryFn: async () => {
      if (!company_id) return [];
      
      const { data, error } = await supabase
        .from("company_employment_requests")
        .select(`
          id, 
          user_id, 
          created_at, 
          profiles!inner(
            id, 
            display_name, 
            avatar_url, 
            city
          )
        `)
        .eq("company_id", company_id)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
        
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAcceptEmployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ request_id }: { request_id: string }) => {
      const { error } = await supabase
        .from("company_employment_requests")
        .update({ status: "accepted" })
        .eq("id", request_id);
        
      if (error) throw error;
    },
    onSuccess: (_data, { request_id }) => {
      qc.invalidateQueries({ queryKey: ["companyPendingRequests"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["companyEmployees"] });
      toast.success("Beschäftigung bestätigt");
    },
    onError: (e: any) => toast.error(e.message ?? "Konnte nicht bestätigen"),
  });
}

export function useDeclineEmployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ request_id }: { request_id: string }) => {
      const { error } = await supabase
        .from("company_employment_requests")
        .update({ status: "declined" })
        .eq("id", request_id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companyPendingRequests"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast("Beschäftigung abgelehnt");
    },
    onError: (e: any) => toast.error(e.message ?? "Konnte nicht ablehnen"),
  });
}

export function useCompanyEmployees(company_id: string | null) {
  return useQuery({
    enabled: !!company_id,
    queryKey: ["companyEmployees", company_id],
    queryFn: async () => {
      if (!company_id) return [];
      
      const { data, error } = await supabase
        .from("company_employment_requests")
        .select(`
          id,
          status,
          created_at,
          profiles!inner(
            id,
            display_name,
            avatar_url,
            city,
            current_status
          )
        `)
        .eq("company_id", company_id)
        .eq("status", "accepted")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCompanyConversion(company_id: string | null) {
  return useQuery({
    enabled: !!company_id,
    queryKey: ["companyConversion", company_id],
    queryFn: async () => {
      if (!company_id) return null;
      
      const { data, error } = await supabase
        .from("company_conversion")
        .select("*")
        .eq("company_id", company_id)
        .single();
        
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });
}