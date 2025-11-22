import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/supabase";

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];

export function getPlanLimits(company: CompanyRow) {
  const maxSeats =
    (company as any).seats ??
    (company as any).max_seats ??
    Infinity;

  const maxLocations =
    (company as any).max_locations === null ||
    (company as any).max_locations === undefined
      ? Infinity
      : (company as any).max_locations!;

  return {
    maxSeats,
    maxLocations,
  };
}

export async function getSeatUsage(companyId: string) {
  const { count, error } = await supabase
    .from("company_users")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .in("status", ["pending", "active"]);

  if (error) {
    console.error("Error loading seat usage", error);
    return 0;
  }

  return count ?? 0;
}

export async function getLocationUsage(companyId: string) {
  const { count, error } = await supabase
    .from("company_locations")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (error) {
    console.error("Error loading location usage", error);
    return 0;
  }

  return count ?? 0;
}


