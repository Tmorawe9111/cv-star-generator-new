import type { PlanKey, PlanInterval } from "./plans";

export interface CompanyBillingSnapshot {
  id: string;
  plan_name?: PlanKey | null;
  plan_interval?: PlanInterval | null;
  available_tokens?: number | null;
  monthly_tokens?: number | null;
  seats_included?: number | null;
  next_invoice_at?: string | null;
  active_plan_id?: string | null;
  selected_plan_id?: string | null;
  name?: string | null;
  logo_url?: string | null;
  total_tokens_ever?: number | null;
}

export interface PurchaseRowV2 {
  id: string;
  company_id?: string;
  created_at: string;
  kind: "plan" | "tokens";
  package_code: string | null;
  amount_total_cents: number;
  currency: string | null;
  status: string | null;
  stripe_checkout_session_id?: string | null;
}

export interface InvoiceRowV2 {
  id: string;
  created_at: string;
  period_start: string | null;
  period_end: string | null;
  total_cents: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  status: string | null;
  stripe_invoice_id?: string | null;
}
