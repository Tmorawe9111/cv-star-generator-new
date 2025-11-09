import { supabase } from "@/integrations/supabase/client";

export type CandidateStatus =
  | "FREIGESCHALTET"
  | "INTERVIEW_GEPLANT"
  | "INTERVIEW_DURCHGEFÜHRT"
  | "ABGESAGT"
  | "ANGEBOT_GESENDET"
  | "EINGESTELLT"
  | "ABGELEHNT"
  | "ON_HOLD";

export interface ChangeCandidateStatusParams {
  companyCandidateId: string;
  nextStatus: CandidateStatus;
  meta?: Record<string, unknown>;
  silent?: boolean;
}

export async function changeCandidateStatus({
  companyCandidateId,
  nextStatus,
  meta = {},
  silent = false,
}: ChangeCandidateStatusParams) {
  const { error } = await supabase.rpc("change_candidate_status", {
    p_company_candidate_id: companyCandidateId,
    p_next_status: nextStatus,
    p_meta: meta,
    p_silent: silent,
  });

  if (error) {
    throw error;
  }
}

