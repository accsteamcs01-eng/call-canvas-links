ALTER TABLE public.calls ADD COLUMN theme text NOT NULL DEFAULT 'telegram';
ALTER TABLE public.calls ADD CONSTRAINT calls_theme_check CHECK (theme IN ('telegram','whatsapp','messenger'));
DROP FUNCTION public.get_public_call(text);
CREATE FUNCTION public.get_public_call(call_slug text)
RETURNS TABLE (
  id uuid, slug text, video_url text, video_type text, person_name text,
  person_photo_url text, background_url text, ringtone_type text, ringtone_value text,
  subtitle text, vibrate boolean, fullscreen_video boolean, unmute_button boolean,
  is_active boolean, preview_image_url text, preview_title text, preview_description text, theme text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT c.id, c.slug, c.video_url, c.video_type, c.person_name,
    c.person_photo_url, c.background_url, c.ringtone_type, c.ringtone_value,
    c.subtitle, c.vibrate, c.fullscreen_video, c.unmute_button,
    c.is_active, c.preview_image_url, c.preview_title, c.preview_description, c.theme
  FROM public.calls AS c
  WHERE c.slug = call_slug AND c.is_active = true
    AND char_length(call_slug) BETWEEN 1 AND 200
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_call(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_call(text) TO anon, authenticated;