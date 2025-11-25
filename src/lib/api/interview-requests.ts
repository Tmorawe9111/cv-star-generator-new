import { supabase } from "@/integrations/supabase/client";

export interface CreateInterviewRequestParams {
  companyCandidateId: string;
  interviewType: "vor_ort" | "online";
  plannedAt: string; // ISO string
  locationAddress?: string;
  companyMessage?: string;
}

export async function createInterviewRequest({
  companyCandidateId,
  interviewType,
  plannedAt,
  locationAddress,
  companyMessage,
}: CreateInterviewRequestParams) {
  const { data, error } = await supabase.rpc("create_interview_request", {
    p_company_candidate_id: companyCandidateId,
    p_interview_type: interviewType,
    p_planned_at: plannedAt,
    p_location_address: locationAddress || null,
    p_company_message: companyMessage || null,
  });

  if (error) {
    throw error;
  }

  return data;
}

export interface AcceptInterviewRequestParams {
  requestId: string;
  candidateResponse?: string;
}

export async function acceptInterviewRequest({
  requestId,
  candidateResponse,
}: AcceptInterviewRequestParams) {
  const { data, error } = await supabase.rpc("accept_interview_request", {
    p_request_id: requestId,
    p_candidate_response: candidateResponse || null,
  });

  if (error) {
    throw error;
  }

  return data;
}

export interface DeclineInterviewRequestParams {
  requestId: string;
  candidateResponse?: string;
}

export async function declineInterviewRequest({
  requestId,
  candidateResponse,
}: DeclineInterviewRequestParams) {
  const { data, error } = await supabase.rpc("decline_interview_request", {
    p_request_id: requestId,
    p_candidate_response: candidateResponse || null,
  });

  if (error) {
    throw error;
  }

  return data;
}

