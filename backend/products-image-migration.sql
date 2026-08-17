-- =============================================
-- TORREN PORTAL - Product Images Migration
-- Execute in Supabase Dashboard -> SQL Editor
-- AFTER running products-schema-migration.sql
-- =============================================

-- === PRODUCTS.IMAGE_URL ===

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url VARCHAR(500);
  END IF;
END $$;

-- === STORAGE BUCKET ===
-- Public bucket so product images are servable directly via their public URL.
-- Uploads only ever happen through the backend's service_role client (which
-- bypasses RLS), so no additional storage.objects policies are required here.

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
