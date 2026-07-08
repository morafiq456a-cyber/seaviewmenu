UPDATE public.products p
SET images = sub.new_images
FROM (
  SELECT pr.id AS pid,
    jsonb_agg(
      CASE WHEN t.elem LIKE '/__l5e/%'
        THEN regexp_replace(t.elem, '^/__l5e/assets-v1/[^/]+/(.+)$', 'seed/\1')
        ELSE t.elem END
      ORDER BY t.ord
    ) AS new_images
  FROM public.products AS pr,
    LATERAL jsonb_array_elements_text(pr.images) WITH ORDINALITY AS t(elem, ord)
  WHERE pr.images::text LIKE '%/__l5e/%'
  GROUP BY pr.id
) sub
WHERE p.id = sub.pid;