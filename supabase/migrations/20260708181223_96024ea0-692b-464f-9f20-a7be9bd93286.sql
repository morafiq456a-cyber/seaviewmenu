UPDATE public.restaurant_settings
SET logo_url = regexp_replace(logo_url, '^/__l5e/assets-v1/[^/]+/(.+)$', 'seed/\1')
WHERE logo_url LIKE '/__l5e/%';

UPDATE public.restaurant_settings
SET cover_url = regexp_replace(cover_url, '^/__l5e/assets-v1/[^/]+/(.+)$', 'seed/\1')
WHERE cover_url LIKE '/__l5e/%';

UPDATE public.restaurant_settings
SET favicon_url = regexp_replace(favicon_url, '^/__l5e/assets-v1/[^/]+/(.+)$', 'seed/\1')
WHERE favicon_url LIKE '/__l5e/%';

UPDATE public.restaurant_settings
SET og_image_url = regexp_replace(og_image_url, '^/__l5e/assets-v1/[^/]+/(.+)$', 'seed/\1')
WHERE og_image_url LIKE '/__l5e/%';

UPDATE public.offers
SET image_url = regexp_replace(image_url, '^/__l5e/assets-v1/[^/]+/(.+)$', 'seed/\1')
WHERE image_url LIKE '/__l5e/%';

UPDATE public.categories
SET image_url = regexp_replace(image_url, '^/__l5e/assets-v1/[^/]+/(.+)$', 'seed/\1')
WHERE image_url LIKE '/__l5e/%';