ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;