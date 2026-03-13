-- Create enum types first
DO $$ BEGIN
    CREATE TYPE public.recipient_type AS ENUM ('profile', 'company');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.notif_type AS ENUM (
        'company_unlocked_you',
        'follow_request_received',
        'pipeline_move_for_you',
        'post_interaction',
        'profile_incomplete_reminder',
        'weekly_digest_user',
        'new_matches_available',
        'follow_accepted_chat_unlocked',
        'candidate_response_to_unlock',
        'pipeline_activity_team',
        'low_tokens',
        'weekly_digest_company',
        'billing_update',
        'product_update',
        'employment_request',
        'employment_accepted',
        'employment_declined'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.notif_channel AS ENUM ('in_app', 'email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;