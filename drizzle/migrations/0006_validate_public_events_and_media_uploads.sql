DROP POLICY "Anyone inserts events" ON public.call_events;
REVOKE INSERT ON public.call_events FROM anon, authenticated;

CREATE FUNCTION public.log_public_call_event(call_slug text, event_name text, duration integer DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  target_call uuid;
BEGIN
  IF call_slug IS NULL OR char_length(call_slug) NOT BETWEEN 1 AND 200
     OR event_name IS NULL OR event_name NOT IN ('opened', 'answered', 'declined', 'ended') THEN
    RAISE EXCEPTION 'Invalid call event' USING ERRCODE = '22023';
  END IF;
  IF (event_name = 'ended' AND (duration IS NULL OR duration < 0 OR duration > 604800))
     OR (event_name <> 'ended' AND duration IS NOT NULL) THEN
    RAISE EXCEPTION 'Invalid call event' USING ERRCODE = '22023';
  END IF;
  SELECT c.id INTO target_call FROM public.calls AS c
    WHERE c.slug = call_slug AND c.is_active = true LIMIT 1;
  IF target_call IS NULL THEN
    RAISE EXCEPTION 'Call unavailable' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.call_events (call_id, event, duration_seconds)
    VALUES (target_call, event_name, duration);
END;
$$;
REVOKE ALL ON FUNCTION public.log_public_call_event(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_public_call_event(text, text, integer) TO anon, authenticated;

ALTER POLICY "Auth upload media" ON storage.objects TO authenticated
WITH CHECK (
  bucket_id IN ('photos', 'backgrounds', 'ringtones', 'videos')
  AND owner_id = (SELECT auth.uid()::text)
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);