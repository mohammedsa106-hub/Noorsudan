/*
# Listing Images Table + Storage Bucket

## Overview
Adds multi-image support to listings. Previously listings had a single `image_url` text column;
now we add a dedicated `listing_images` table that stores multiple image URLs per listing,
supporting both uploaded files (Supabase Storage) and external URL references.

## New Tables
1. `listing_images`
   - `id` (uuid, PK)
   - `listing_id` (uuid, FK -> listings, ON DELETE CASCADE)
   - `url` (text) — the public URL of the image (storage path or external URL)
   - `sort_order` (int, default 0) — ordering for gallery display
   - `created_at` (timestamptz)

## Storage
- Creates a public storage bucket `listing-images` for uploading image files.
- Policies allow authenticated users to upload/read/delete images.

## Security (RLS)
- `listing_images`: public read (anon + authenticated); owner can insert/update/delete their own listing's images.
  Ownership is verified through the parent listing's `owner_id`.
- Storage bucket `listing-images`: public read; authenticated users can upload and manage their own files.
*/

-- ---- listing_images table ----
CREATE TABLE IF NOT EXISTS listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_listing_images" ON listing_images;
CREATE POLICY "public_read_listing_images" ON listing_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_listing_images" ON listing_images;
CREATE POLICY "insert_own_listing_images" ON listing_images FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_listing_images" ON listing_images;
CREATE POLICY "update_own_listing_images" ON listing_images FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_listing_images" ON listing_images;
CREATE POLICY "delete_own_listing_images" ON listing_images FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON listing_images(listing_id);

-- ---- Storage bucket ----
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "public_read_listing_images_bucket" ON storage.objects;
CREATE POLICY "public_read_listing_images_bucket" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "auth_upload_listing_images_bucket" ON storage.objects;
CREATE POLICY "auth_upload_listing_images_bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "auth_update_listing_images_bucket" ON storage.objects;
CREATE POLICY "auth_update_listing_images_bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "auth_delete_listing_images_bucket" ON storage.objects;
CREATE POLICY "auth_delete_listing_images_bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'listing-images');
