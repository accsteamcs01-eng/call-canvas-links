CREATE POLICY "Auth read media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('photos','backgrounds','ringtones','videos'));