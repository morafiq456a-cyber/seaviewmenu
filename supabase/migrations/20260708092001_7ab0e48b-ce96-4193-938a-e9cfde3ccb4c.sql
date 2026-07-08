CREATE POLICY "Anyone can view menu media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-media');

CREATE POLICY "Admins can upload menu media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-media' AND public.is_admin());

CREATE POLICY "Admins can update menu media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'menu-media' AND public.is_admin());

CREATE POLICY "Admins can delete menu media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-media' AND public.is_admin());