ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS favicon_url text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS currency_position text NOT NULL DEFAULT 'before',
  ADD COLUMN IF NOT EXISTS decimal_places integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Asia/Riyadh';