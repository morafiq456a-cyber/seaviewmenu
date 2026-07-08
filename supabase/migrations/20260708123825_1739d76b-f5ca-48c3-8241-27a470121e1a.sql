-- Soft-delete support for products and categories
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS products_deleted_at_idx ON public.products (deleted_at);
CREATE INDEX IF NOT EXISTS categories_deleted_at_idx ON public.categories (deleted_at);