/*
# Noor Sudan - Deep Architecture Expansion

## Overview
Adds working hours, Bankak payment details, featured/sponsored monetization flags,
orders with receipt upload, jobs with CV upload, training with CV upload,
and menu items support.

## 1. Modified Tables

### `listings`
- `opening_time` (time, nullable) — daily opening time
- `closing_time` (time, nullable) — daily closing time
- `bankak_account` (text, default '') — Bankak mobile banking account info for P2P transfers
- `bankak_name` (text, default '') — account holder name for Bankak
- `is_featured` (boolean, default false) — featured/sponsored listing (monetization)
- `featured_until` (timestamptz, nullable) — when featured status expires
- `is_sponsored` (boolean, default false) — paid promotional boost

## 2. New Tables

### `orders` — P2P order workflow with receipt upload
### `jobs` — Job postings under Companies/Corporate section
### `job_applications` — CV uploads for job postings
### `training_programs` — Training programs under Companies/Corporate section
### `training_applications` — CV uploads for training programs

## 3. Security (RLS)
- `orders`: customer can read/insert their own; listing owner can read their own; admin can read/update all
- `jobs`: public read; listing owner can insert/update/delete; admin can update
- `job_applications`: applicant can read/insert their own; listing owner + admin can read
- `training_programs`: public read; listing owner can insert/update/delete; admin can update
- `training_applications`: applicant can read/insert their own; listing owner + admin can read
*/

-- ---- listings: working hours + Bankak + monetization ----
ALTER TABLE listings ADD COLUMN IF NOT EXISTS opening_time time;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS closing_time time;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bankak_account text NOT NULL DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bankak_name text NOT NULL DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_sponsored boolean NOT NULL DEFAULT false;

-- ---- orders ----
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  receipt_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_orders" ON orders;
CREATE POLICY "read_own_orders" ON orders FOR SELECT
  TO authenticated USING (
    auth.uid() = customer_id
    OR EXISTS (SELECT 1 FROM listings l WHERE l.id = orders.listing_id AND l.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_order" ON orders;
CREATE POLICY "insert_own_order" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "update_own_order" ON orders;
CREATE POLICY "update_own_order" ON orders FOR UPDATE
  TO authenticated USING (
    auth.uid() = customer_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  ) WITH CHECK (
    auth.uid() = customer_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- ---- jobs ----
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  requirements text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_jobs" ON jobs;
CREATE POLICY "public_read_jobs" ON jobs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_insert_jobs" ON jobs;
CREATE POLICY "owner_insert_jobs" ON jobs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = jobs.listing_id AND l.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_update_jobs" ON jobs;
CREATE POLICY "owner_update_jobs" ON jobs FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = jobs.listing_id AND l.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "owner_delete_jobs" ON jobs;
CREATE POLICY "owner_delete_jobs" ON jobs FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = jobs.listing_id AND l.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_jobs_listing ON jobs(listing_id);

-- ---- job_applications ----
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_name text NOT NULL DEFAULT '',
  applicant_phone text NOT NULL DEFAULT '',
  cv_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_applications" ON job_applications;
CREATE POLICY "read_own_applications" ON job_applications FOR SELECT
  TO authenticated USING (
    auth.uid() = applicant_id
    OR EXISTS (
      SELECT 1 FROM jobs j
      JOIN listings l ON l.id = j.listing_id
      WHERE j.id = job_applications.job_id AND l.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_application" ON job_applications;
CREATE POLICY "insert_own_application" ON job_applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = applicant_id);

CREATE INDEX IF NOT EXISTS idx_job_apps_job ON job_applications(job_id);

-- ---- training_programs ----
CREATE TABLE IF NOT EXISTS training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  duration text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_training" ON training_programs;
CREATE POLICY "public_read_training" ON training_programs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_insert_training" ON training_programs;
CREATE POLICY "owner_insert_training" ON training_programs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = training_programs.listing_id AND l.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_update_training" ON training_programs;
CREATE POLICY "owner_update_training" ON training_programs FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = training_programs.listing_id AND l.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "owner_delete_training" ON training_programs;
CREATE POLICY "owner_delete_training" ON training_programs FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = training_programs.listing_id AND l.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_training_listing ON training_programs(listing_id);

-- ---- training_applications ----
CREATE TABLE IF NOT EXISTS training_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_name text NOT NULL DEFAULT '',
  applicant_phone text NOT NULL DEFAULT '',
  cv_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_training_apps" ON training_applications;
CREATE POLICY "read_own_training_apps" ON training_applications FOR SELECT
  TO authenticated USING (
    auth.uid() = applicant_id
    OR EXISTS (
      SELECT 1 FROM training_programs t
      JOIN listings l ON l.id = t.listing_id
      WHERE t.id = training_applications.training_id AND l.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_training_app" ON training_applications;
CREATE POLICY "insert_own_training_app" ON training_applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = applicant_id);

CREATE INDEX IF NOT EXISTS idx_training_apps_training ON training_applications(training_id);

-- ---- Storage buckets for receipts and CVs ----
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for receipts bucket
DROP POLICY IF EXISTS "public_read_receipts" ON storage.objects;
CREATE POLICY "public_read_receipts" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "auth_upload_receipts" ON storage.objects;
CREATE POLICY "auth_upload_receipts" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'receipts');

-- Storage policies for documents bucket (CVs)
DROP POLICY IF EXISTS "public_read_documents" ON storage.objects;
CREATE POLICY "public_read_documents" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "auth_upload_documents" ON storage.objects;
CREATE POLICY "auth_upload_documents" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'documents');