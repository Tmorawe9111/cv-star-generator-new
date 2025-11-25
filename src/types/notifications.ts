export type RecipientType = 'profile' | 'company';

export type NotifType =
  | 'company_unlocked_you'
  | 'follow_request_received'
  | 'pipeline_move_for_you'
  | 'post_interaction'
  | 'profile_incomplete_reminder'
  | 'weekly_digest_user'
  | 'new_matches_available'
  | 'follow_accepted_chat_unlocked'
  | 'candidate_response_to_unlock'
  | 'pipeline_activity_team'
  | 'low_tokens'
  | 'weekly_digest_company'
  | 'billing_update'
  | 'product_update'
  | 'employment_request'
  | 'employment_accepted'
  | 'employment_declined'
  | 'application_received'
  | 'application_withdrawn'
  | 'candidate_message'
  | 'job_post_approved'
  | 'job_post_rejected'
  | 'job_post_expiring'
  | 'billing_invoice_ready'
  | 'interview_request_received'
  | 'interview_request_accepted'
  | 'interview_request_declined';

export type NotifChannel = 'in_app' | 'email';

export type NotificationRow = {
  id: string;
  recipient_type: RecipientType;
  recipient_id: string;
  type: NotifType;
  title: string;
  body: string | null;
  actor_type: RecipientType | null;
  actor_id: string | null;
  payload: any; // JSON
  group_key: string | null;
  priority: number | null;
  channels: NotifChannel[];
  read_at: string | null;
  seen_at: string | null;
  created_at: string;
};

export type NotifPrefRow = {
  id: string;
  user_id: string;         // für Company-User: deren profile_id
  type: NotifType;
  in_app: boolean;
  email: boolean;
};