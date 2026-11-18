CREATE TABLE public.contacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 name text NOT NULL CHECK (length(trim(name)) > 0),
 photo_url text,
 subtitle text NOT NULL DEFAULT 'Chamada de vídeo',
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads contacts" ON public.contacts FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Owner inserts contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Owner updates contacts" ON public.contacts FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Owner deletes contacts" ON public.contacts FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX contacts_user_id_idx ON public.contacts(user_id);
ALTER TABLE public.calls ADD COLUMN contact_id uuid;
ALTER TABLE public.calls ADD CONSTRAINT calls_contact_owner_fkey FOREIGN KEY (contact_id, user_id) REFERENCES public.contacts(id, user_id) ON DELETE SET NULL (contact_id);
CREATE INDEX calls_contact_id_idx ON public.calls(contact_id) WHERE contact_id IS NOT NULL;