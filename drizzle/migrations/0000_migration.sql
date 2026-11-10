CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  video_url text NOT NULL DEFAULT '',
  video_type text NOT NULL DEFAULT 'mp4' CHECK (video_type IN ('mp4','youtube','vimeo','iframe')),
  person_name text NOT NULL DEFAULT '',
  person_photo_url text,
  background_url text,
  ringtone_type text NOT NULL DEFAULT 'preset' CHECK (ringtone_type IN ('preset','custom')),
  ringtone_value text NOT NULL DEFAULT 'classic',
  subtitle text NOT NULL DEFAULT 'Chamada de vídeo',
  vibrate boolean NOT NULL DEFAULT true,
  fullscreen_video boolean NOT NULL DEFAULT true,
  unmute_button boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.calls TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO authenticated;
GRANT ALL ON public.calls TO service_role;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read calls" ON public.calls FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner inserts" ON public.calls FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates" ON public.calls FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner deletes" ON public.calls FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.call_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  event text NOT NULL CHECK (event IN ('opened','answered','declined','ended')),
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.call_events TO anon;
GRANT SELECT, INSERT ON public.call_events TO authenticated;
GRANT ALL ON public.call_events TO service_role;
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone inserts events" ON public.call_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owner reads events" ON public.call_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.calls c WHERE c.id = call_id AND c.user_id = auth.uid()));
CREATE INDEX ON public.call_events(call_id);

CREATE POLICY "Auth upload media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('photos','backgrounds','ringtones','videos'));
CREATE POLICY "Auth update media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('photos','backgrounds','ringtones','videos') AND owner = auth.uid());
CREATE POLICY "Auth delete media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('photos','backgrounds','ringtones','videos') AND owner = auth.uid());