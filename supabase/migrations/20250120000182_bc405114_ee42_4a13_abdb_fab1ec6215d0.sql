-- Full migration for social graph + messaging (ordered to avoid dependencies issues)

-- 1) Tables
CREATE TABLE IF NOT EXISTS public.connections (
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','blocked','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz NULL,
  PRIMARY KEY (requester_id, addressee_id),
  CONSTRAINT connections_no_self CHECK (requester_id <> addressee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_connections_pair
  ON public.connections (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));
CREATE INDEX IF NOT EXISTS idx_connections_addressee_status ON public.connections (addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_requester_status ON public.connections (requester_id, status);

CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT blocks_no_self CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  a_id uuid NOT NULL,
  b_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz,
  CONSTRAINT conversations_order CHECK (a_id < b_id),
  CONSTRAINT conversations_distinct CHECK (a_id <> b_id),
  UNIQUE (a_id, b_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations (last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages (conversation_id, created_at);

-- 2) Functions (require tables above)
CREATE OR REPLACE FUNCTION public.is_connected(_u1 uuid, _u2 uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE status = 'accepted'
        AND (
          (requester_id = _u1 AND addressee_id = _u2)
          OR (requester_id = _u2 AND addressee_id = _u1)
        )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks
      WHERE (blocker_id = _u1 AND blocked_id = _u2)
         OR (blocker_id = _u2 AND blocked_id = _u1)
    );
$$;

COMMENT ON FUNCTION public.is_connected(uuid, uuid) IS 'True if users have an accepted connection (either direction) and no block exists between them.';

CREATE OR REPLACE FUNCTION public.can_access_conversation(_conv_id uuid, _uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conv_id AND (_uid = c.a_id OR _uid = c.b_id)
  );
$$;

-- 3) Triggers
CREATE OR REPLACE FUNCTION public.set_connections_responded_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status <> 'pending' THEN
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_responded_at ON public.connections;
CREATE TRIGGER set_responded_at
BEFORE UPDATE ON public.connections
FOR EACH ROW EXECUTE FUNCTION public.set_connections_responded_at();

CREATE OR REPLACE FUNCTION public.create_conversation_on_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _a uuid;
  _b uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    _a := LEAST(NEW.requester_id, NEW.addressee_id);
    _b := GREATEST(NEW.requester_id, NEW.addressee_id);

    INSERT INTO public.conversations (a_id, b_id, last_message_at)
    VALUES (_a, _b, now())
    ON CONFLICT (a_id, b_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_connections_accept ON public.connections;
CREATE TRIGGER on_connections_accept
AFTER UPDATE ON public.connections
FOR EACH ROW EXECUTE FUNCTION public.create_conversation_on_accept();

-- 4) RLS enable + policies
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- connections policies
DROP POLICY IF EXISTS "Users can view their own connections" ON public.connections;
CREATE POLICY "Users can view their own connections" ON public.connections
FOR SELECT USING (requester_id = auth.uid() OR addressee_id = auth.uid());

DROP POLICY IF EXISTS "Users can create connection requests" ON public.connections;
CREATE POLICY "Users can create connection requests" ON public.connections
FOR INSERT WITH CHECK (requester_id = auth.uid() AND requester_id <> addressee_id);

DROP POLICY IF EXISTS "Participants can update connection status" ON public.connections;
CREATE POLICY "Participants can update connection status" ON public.connections
FOR UPDATE USING (requester_id = auth.uid() OR addressee_id = auth.uid());

DROP POLICY IF EXISTS "Requester can delete pending requests" ON public.connections;
CREATE POLICY "Requester can delete pending requests" ON public.connections
FOR DELETE USING (requester_id = auth.uid() AND status = 'pending');

-- blocks policies
DROP POLICY IF EXISTS "Blocker manages their blocks" ON public.blocks;
CREATE POLICY "Blocker manages their blocks" ON public.blocks
FOR ALL USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());

-- conversations policies (function already exists)
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations" ON public.conversations
FOR SELECT USING (a_id = auth.uid() OR b_id = auth.uid());

DROP POLICY IF EXISTS "Participants can create conversations if connected" ON public.conversations;
CREATE POLICY "Participants can create conversations if connected" ON public.conversations
FOR INSERT WITH CHECK ((a_id = auth.uid() OR b_id = auth.uid()) AND public.is_connected(a_id, b_id));

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations
FOR UPDATE USING (a_id = auth.uid() OR b_id = auth.uid());

-- messages policies
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages" ON public.messages
FOR SELECT USING (public.can_access_conversation(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" ON public.messages
FOR INSERT WITH CHECK (sender_id = auth.uid() AND public.can_access_conversation(conversation_id, auth.uid()));
