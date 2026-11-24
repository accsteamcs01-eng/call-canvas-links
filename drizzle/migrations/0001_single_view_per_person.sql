ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS single_view boolean NOT NULL DEFAULT false;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS used_message text;

ALTER TABLE public.call_events DROP CONSTRAINT IF EXISTS call_events_event_check;
ALTER TABLE public.call_events ADD CONSTRAINT call_events_event_check CHECK (event = ANY (ARRAY['opened','answered','declined','ended','blocked']));

CREATE TABLE public.call_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_reason text,
  blocked_attempts integer NOT NULL DEFAULT 0,
  UNIQUE (call_id, token_hash)
);
GRANT SELECT ON public.call_viewers TO authenticated;
GRANT ALL ON public.call_viewers TO service_role;
ALTER TABLE public.call_viewers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads viewers" ON public.call_viewers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.calls c WHERE c.id = call_viewers.call_id AND c.user_id = (SELECT auth.uid())));

DROP FUNCTION IF EXISTS public.get_public_call(text);
CREATE FUNCTION public.get_public_call(call_slug text)
 RETURNS TABLE(id uuid, slug text, video_url text, video_type text, person_name text, person_photo_url text, background_url text, ringtone_type text, ringtone_value text, subtitle text, vibrate boolean, fullscreen_video boolean, unmute_button boolean, is_active boolean, preview_image_url text, preview_title text, preview_description text, theme text, single_view boolean, used_message text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  SELECT c.id, c.slug, c.video_url, c.video_type, c.person_name,
    c.person_photo_url, c.background_url, c.ringtone_type, c.ringtone_value,
    c.subtitle, c.vibrate, c.fullscreen_video, c.unmute_button,
    c.is_active, c.preview_image_url, c.preview_title, c.preview_description, c.theme,
    c.single_view, c.used_message
  FROM public.calls AS c
  WHERE c.slug = call_slug AND c.is_active = true
    AND char_length(call_slug) BETWEEN 1 AND 200
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_call(text) TO anon, authenticated;

CREATE FUNCTION public.claim_view(p_slug text, p_token text, p_preview boolean DEFAULT false)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
  c record;
  h text;
  v record;
BEGIN
  IF p_slug IS NULL OR char_length(p_slug) NOT BETWEEN 1 AND 200 THEN RETURN 'allowed'; END IF;
  SELECT x.id, x.user_id, x.single_view INTO c FROM public.calls x
    WHERE x.slug = p_slug AND x.is_active = true LIMIT 1;
  IF c.id IS NULL OR c.single_view IS NOT TRUE THEN RETURN 'allowed'; END IF;
  IF p_preview AND auth.uid() IS NOT NULL AND auth.uid() = c.user_id THEN RETURN 'allowed'; END IF;
  IF p_token IS NULL OR char_length(p_token) NOT BETWEEN 8 AND 200 THEN RETURN 'allowed'; END IF;
  h := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');

  INSERT INTO public.call_viewers (call_id, token_hash) VALUES (c.id, h)
    ON CONFLICT (call_id, token_hash) DO NOTHING;
  IF FOUND THEN RETURN 'allowed'; END IF;

  SELECT * INTO v FROM public.call_viewers WHERE call_id = c.id AND token_hash = h FOR UPDATE;
  IF v.locked_at IS NULL AND v.first_seen_at > now() - interval '24 hours' THEN RETURN 'allowed'; END IF;

  UPDATE public.call_viewers
    SET locked_at = COALESCE(locked_at, now()),
        locked_reason = COALESCE(locked_reason, 'expired'),
        blocked_attempts = blocked_attempts + 1
    WHERE id = v.id;
  INSERT INTO public.call_events (call_id, event) VALUES (c.id, 'blocked');
  RETURN 'blocked';
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_view(text, text, boolean) TO anon, authenticated;

CREATE FUNCTION public.finish_view(p_slug text, p_token text, p_reason text DEFAULT 'ended')
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
BEGIN
  IF p_slug IS NULL OR p_token IS NULL OR char_length(p_token) NOT BETWEEN 8 AND 200 THEN RETURN; END IF;
  UPDATE public.call_viewers v
    SET locked_at = now(), locked_reason = left(COALESCE(p_reason, 'ended'), 40)
    FROM public.calls c
    WHERE c.slug = p_slug AND c.single_view = true AND v.call_id = c.id
      AND v.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
      AND v.locked_at IS NULL;
EXCEPTION WHEN OTHERS THEN RETURN;
END;
$$;
GRANT EXECUTE ON FUNCTION public.finish_view(text, text, text) TO anon, authenticated;

CREATE FUNCTION public.reset_viewers(p_call_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.calls c WHERE c.id = p_call_id AND c.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.call_viewers WHERE call_id = p_call_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.reset_viewers(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.reset_viewers(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_view(text, text, boolean) FROM public;
REVOKE EXECUTE ON FUNCTION public.finish_view(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_view(text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_view(text, text, text) TO anon, authenticated;