-- Test data for clean posts system
-- Insert some sample posts to test the new system

-- Insert test posts (replace user_id with actual user IDs from your auth.users table)
INSERT INTO public.posts (id, user_id, content, image_url, status, created_at) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Hallo zusammen! Das ist mein erster Post im neuen System. Wie gefällt euch das neue Design? 🚀',
  null,
  'published',
  now() - interval '2 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Gerade eine interessante Schulung besucht! Die neuen Technologien entwickeln sich so schnell. Wer hat auch schon Erfahrung mit React gemacht?',
  null,
  'published',
  now() - interval '1 hour'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Freue mich auf das Wochenende! Zeit für ein paar neue Projekte und vielleicht einen Ausflug in die Stadt. Was macht ihr so?',
  null,
  'published',
  now() - interval '30 minutes'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Wichtiger Hinweis: Die neue Community-Funktion ist jetzt live! Postet gerne eure Gedanken und Erfahrungen. Gemeinsam lernen wir mehr! 💪',
  null,
  'published',
  now() - interval '15 minutes'
);

-- Update post counters (they should be 0 by default)
UPDATE public.posts SET 
  likes_count = 0,
  comments_count = 0,
  shares_count = 0;