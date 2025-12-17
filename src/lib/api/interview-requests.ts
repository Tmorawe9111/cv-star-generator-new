import { supabase } from "@/integrations/supabase/client";

export interface CreateInterviewRequestParams {
  companyCandidateId: string;
  interviewType: "vor_ort" | "online";
  plannedAt?: string; // ISO string (deprecated, use timeSlots instead)
  timeSlots?: Array<{ start: string; end: string }>; // Array of time slots (1-3)
  locationAddress?: string;
  companyMessage?: string;
  videoLink?: string;
  calendarProvider?: "google" | "outlook" | "teams" | "calendly" | "zoom" | "manual";
}

export async function createInterviewRequest({
  companyCandidateId,
  interviewType,
  plannedAt,
  timeSlots,
  locationAddress,
  companyMessage,
  videoLink,
  calendarProvider = "manual",
}: CreateInterviewRequestParams) {
  // Format time slots for RPC
  // timeSlots should already be ISO strings from the component
  const formattedTimeSlots = timeSlots || null;

  console.log('Creating interview request with:', {
    companyCandidateId,
    interviewType,
    timeSlots: formattedTimeSlots,
    locationAddress,
    companyMessage,
  });

  try {
    const { data, error } = await supabase.rpc("create_interview_request", {
      p_company_candidate_id: companyCandidateId,
      p_interview_type: interviewType,
      p_planned_at: plannedAt || null,
      p_time_slots: formattedTimeSlots as any, // Pass as jsonb - Supabase will handle conversion
      p_location_address: locationAddress || null,
      p_company_message: companyMessage || null,
      p_video_link: videoLink || null,
      p_calendar_provider: calendarProvider,
    });

    if (error) {
      console.error('RPC Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    return data;
  } catch (err: any) {
    console.error('Error in createInterviewRequest:', err);
    throw err;
  }
}

export interface AcceptInterviewRequestParams {
  requestId: string;
  selectedSlotIndex?: number; // Which time slot was selected (0-2)
  candidateResponse?: string;
}

export async function acceptInterviewRequest({
  requestId,
  selectedSlotIndex = 0,
  candidateResponse,
}: AcceptInterviewRequestParams) {
  const { data, error } = await supabase.rpc("accept_interview_request", {
    p_request_id: requestId,
    p_selected_slot_index: selectedSlotIndex,
    p_candidate_response: candidateResponse || null,
  });

  if (error) {
    throw error;
  }

  return data;
}

export interface CreateTimeSlotProposalParams {
  interviewRequestId: string;
  proposedAt: string; // ISO string
  candidateMessage?: string;
}

export async function createTimeSlotProposal({
  interviewRequestId,
  proposedAt,
  candidateMessage,
}: CreateTimeSlotProposalParams) {
  const { data, error } = await supabase.rpc("create_time_slot_proposal", {
    p_interview_request_id: interviewRequestId,
    p_proposed_at: proposedAt,
    p_candidate_message: candidateMessage || null,
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

