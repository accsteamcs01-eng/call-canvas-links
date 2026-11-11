CREATE INDEX IF NOT EXISTS calls_user_created_idx ON public.calls (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS call_events_call_created_idx ON public.call_events (call_id, created_at DESC);
CREATE INDEX IF NOT EXISTS call_events_created_idx ON public.call_events (created_at DESC);