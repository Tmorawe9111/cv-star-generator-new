-- Phase 1: Schema extensions and content tables for Composer/Feed
-- Notes:
-- - Keep existing posts table compatible; add author fields and celebration flag
-- - Create related content tables with proper RLS
-- - Add triggers for data integrity (timestamps, scheduling validation)
-- - Create indexes for feed performance
-- - Configure storage buckets and policies for post media/documents using signed URLs

-- 1) Extend posts table minimally and safely
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_id uuid,
  ADD COLUMN IF NOT EXISTS author_type text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS celebration boolean NOT NULL DEFAULT false;

-- Author type restriction (enum-like via CHECK)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_author_type_check'
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_author_type_check
    CHECK (author_type IN ('user','company'));
  END IF;
END $$;

-- Visibility/status enumerations (if not present already)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_visibility_check'
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_visibility_check
    CHECK (visibility IN ('CommunityOnly','CommunityAndCompanies'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_status_check'
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_status_check
    CHECK (status IN ('draft','scheduled','published','deleted'));
  END IF;
END $$;

-- 2) Utility function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Posts trigger to backfill/maintain author_id and validate scheduling
CREATE OR REPLACE FUNCTION public.posts_biu_set_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Backfill author_id from legacy user_id if missing
  IF NEW.author_id IS NULL THEN
    NEW.author_id := COALESCE(NEW.user_id, auth.uid());
  END IF;

  -- Ensure published_at set when transitioning to published
  IF TG_OP = 'INSERT' THEN
    -- leave existing default behavior; if status is published and published_at is null, set now
    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
      NEW.published_at := now();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') THEN
      NEW.published_at := now();
    END IF;
  END IF;

  -- Validate scheduled posts have a future scheduled_at (use trigger per guidelines)
  IF NEW.status = 'scheduled' THEN
    IF NEW.scheduled_at IS NULL OR NEW.scheduled_at <= now() THEN
      RAISE EXCEPTION 'INVALID_SCHEDULE_TIME: scheduled_at must be in the future';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_biu_set_defaults ON public.posts;
CREATE TRIGGER trg_posts_biu_set_defaults
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.posts_biu_set_defaults();

-- 4) Content tables
CREATE TABLE IF NOT EXISTS public.post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('image','video')),
  storage_path text NOT NULL,
  width integer,
  height integer,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  question text NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.post_polls(id) ON DELETE CASCADE,
  option_text text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.post_poll_votes (
  poll_id uuid NOT NULL REFERENCES public.post_polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.post_poll_options(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, voter_id)
);

CREATE TABLE IF NOT EXISTS public.post_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_online boolean NOT NULL DEFAULT true,
  location text,
  link_url text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reposter_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5) RLS Policies
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

-- post_media policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_media' AND policyname='Read media if viewer can see post') THEN
    CREATE POLICY "Read media if viewer can see post" ON public.post_media
    FOR SELECT USING (can_view_post(post_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_media' AND policyname='Authors can insert media') THEN
    CREATE POLICY "Authors can insert media" ON public.post_media
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid()))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_media' AND policyname='Authors can update media') THEN
    CREATE POLICY "Authors can update media" ON public.post_media
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid()))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_media' AND policyname='Authors can delete media') THEN
    CREATE POLICY "Authors can delete media" ON public.post_media
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid()))
    );
  END IF;
END $$;

-- post_documents policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_documents' AND policyname='Read docs if viewer can see post') THEN
    CREATE POLICY "Read docs if viewer can see post" ON public.post_documents
    FOR SELECT USING (can_view_post(post_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_documents' AND policyname='Authors can insert docs') THEN
    CREATE POLICY "Authors can insert docs" ON public.post_documents
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid()))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_documents' AND policyname='Authors can update docs') THEN
    CREATE POLICY "Authors can update docs" ON public.post_documents
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid()))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_documents' AND policyname='Authors can delete docs') THEN
    CREATE POLICY "Authors can delete docs" ON public.post_documents
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid()))
    );
  END IF;
END $$;

-- post_polls policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_polls' AND policyname='Read polls if viewer can see post') THEN
    CREATE POLICY "Read polls if viewer can see post" ON public.post_polls
    FOR SELECT USING (can_view_post(post_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_polls' AND policyname='Authors can insert poll') THEN
    CREATE POLICY "Authors can insert poll" ON public.post_polls
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid()))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_polls' AND policyname='Authors can update poll') THEN
    CREATE POLICY "Authors can update poll" ON public.post_polls
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid()))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_polls' AND policyname='Authors can delete poll') THEN
    CREATE POLICY "Authors can delete poll" ON public.post_polls
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid()))
    );
  END IF;
END $$;

-- post_poll_options policies: managed by author of poll/post
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_poll_options' AND policyname='Read poll options if viewer can see post') THEN
    CREATE POLICY "Read poll options if viewer can see post" ON public.post_poll_options
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.post_polls pp
        JOIN public.posts p ON p.id = pp.post_id
        WHERE pp.id = post_poll_options.poll_id AND can_view_post(p.id, auth.uid())
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_poll_options' AND policyname='Authors can manage poll options') THEN
    CREATE POLICY "Authors can manage poll options" ON public.post_poll_options
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.post_polls pp
        JOIN public.posts p ON p.id = pp.post_id
        WHERE pp.id = post_poll_options.poll_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.post_polls pp
        JOIN public.posts p ON p.id = pp.post_id
        WHERE pp.id = post_poll_options.poll_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
      )
    );
  END IF;
END $$;

-- post_poll_votes policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_poll_votes' AND policyname='Read poll votes if viewer can see post') THEN
    CREATE POLICY "Read poll votes if viewer can see post" ON public.post_poll_votes
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.post_polls pp
        JOIN public.posts p ON p.id = pp.post_id
        WHERE pp.id = post_poll_votes.poll_id AND can_view_post(p.id, auth.uid())
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_poll_votes' AND policyname='Users can vote once and only while active') THEN
    CREATE POLICY "Users can vote once and only while active" ON public.post_poll_votes
    FOR INSERT WITH CHECK (
      auth.uid() = voter_id AND
      EXISTS (
        SELECT 1 FROM public.post_polls pp
        WHERE pp.id = post_poll_votes.poll_id AND pp.ends_at > now()
      )
    );
  END IF;
END $$;

-- post_events policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_events' AND policyname='Read events if viewer can see post') THEN
    CREATE POLICY "Read events if viewer can see post" ON public.post_events
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = post_events.post_id AND can_view_post(p.id, auth.uid())
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_events' AND policyname='Authors can manage events') THEN
    CREATE POLICY "Authors can manage events" ON public.post_events
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = post_events.post_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = post_events.post_id AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
      )
    );
  END IF;
END $$;

-- post_reposts policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_reposts' AND policyname='Read reposts if viewer can see post') THEN
    CREATE POLICY "Read reposts if viewer can see post" ON public.post_reposts
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_reposts.post_id AND can_view_post(p.id, auth.uid()))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_reposts' AND policyname='Users can repost visible posts') THEN
    CREATE POLICY "Users can repost visible posts" ON public.post_reposts
    FOR INSERT WITH CHECK (
      auth.uid() IS NOT NULL AND
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_reposts.post_id AND can_view_post(p.id, auth.uid()))
    );
  END IF;
END $$;

-- 6) Poll vote trigger to guard against late voting (defensive)
CREATE OR REPLACE FUNCTION public.post_poll_votes_before_insert()
RETURNS TRIGGER AS $$
DECLARE v_ends_at timestamptz; BEGIN
  SELECT ends_at INTO v_ends_at FROM public.post_polls WHERE id = NEW.poll_id;
  IF v_ends_at IS NULL OR v_ends_at <= now() THEN
    RAISE EXCEPTION 'POLL_CLOSED: Voting period ended';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_poll_votes_bi ON public.post_poll_votes;
CREATE TRIGGER trg_post_poll_votes_bi
BEFORE INSERT ON public.post_poll_votes
FOR EACH ROW EXECUTE FUNCTION public.post_poll_votes_before_insert();

-- 7) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_published_at_desc ON public.posts (published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts (status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts (author_id, author_type);

CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON public.post_media (post_id);
CREATE INDEX IF NOT EXISTS idx_post_documents_post_id ON public.post_documents (post_id);
CREATE INDEX IF NOT EXISTS idx_post_polls_post_id ON public.post_polls (post_id);
CREATE INDEX IF NOT EXISTS idx_post_poll_votes_poll_id ON public.post_poll_votes (poll_id);
CREATE INDEX IF NOT EXISTS idx_post_events_post_id ON public.post_events (post_id);
CREATE INDEX IF NOT EXISTS idx_post_reposts_post_id ON public.post_reposts (post_id);

-- Existing likes/comments tables: ensure helpful indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id_created_at ON public.post_comments (post_id, created_at);

-- 8) Storage buckets and policies (private, signed URLs recommended)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'post-media') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('post-media','post-media', false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'post-docs') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('post-docs','post-docs', false);
  END IF;
END $$;

-- Storage policies for post-media
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Post media are readable if viewer can see post'
  ) THEN
    CREATE POLICY "Post media are readable if viewer can see post"
    ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id = 'post-media' AND (
        -- Author can always read
        EXISTS (
          SELECT 1 FROM public.posts p
          WHERE p.id = ((storage.foldername(name))[1])::uuid
            AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
        )
        OR can_view_post(((storage.foldername(name))[1])::uuid, auth.uid())
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authors can write post media'
  ) THEN
    CREATE POLICY "Authors can write post media"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'post-media' AND
      EXISTS (
        SELECT 1 FROM public.posts p
        WHERE p.id = ((storage.foldername(name))[1])::uuid
          AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authors can update/delete post media'
  ) THEN
    CREATE POLICY "Authors can update/delete post media"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'post-media' AND
      EXISTS (
        SELECT 1 FROM public.posts p
        WHERE p.id = ((storage.foldername(name))[1])::uuid
          AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
      )
    );

    CREATE POLICY "Authors can delete post media"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'post-media' AND
      EXISTS (
        SELECT 1 FROM public.posts p
        WHERE p.id = ((storage.foldername(name))[1])::uuid
          AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
      )
    );
  END IF;
END $$;

-- Storage policies for post-docs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Post docs are readable if viewer can see post'
  ) THEN
    CREATE POLICY "Post docs are readable if viewer can see post"
    ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id = 'post-docs' AND (
        EXISTS (
          SELECT 1 FROM public.posts p
          WHERE p.id = ((storage.foldername(name))[1])::uuid
            AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
        )
        OR can_view_post(((storage.foldername(name))[1])::uuid, auth.uid())
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authors can write post docs'
  ) THEN
    CREATE POLICY "Authors can write post docs"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'post-docs' AND
      EXISTS (
        SELECT 1 FROM public.posts p
        WHERE p.id = ((storage.foldername(name))[1])::uuid
          AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authors can update/delete post docs'
  ) THEN
    CREATE POLICY "Authors can update/delete post docs"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'post-docs' AND
      EXISTS (
        SELECT 1 FROM public.posts p
        WHERE p.id = ((storage.foldername(name))[1])::uuid
          AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
      )
    );

    CREATE POLICY "Authors can delete post docs"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'post-docs' AND
      EXISTS (
        SELECT 1 FROM public.posts p
        WHERE p.id = ((storage.foldername(name))[1])::uuid
          AND (p.author_id = auth.uid() OR p.user_id = auth.uid())
      )
    );
  END IF;
END $$;
