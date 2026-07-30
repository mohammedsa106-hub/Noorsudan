/*
# Nour Sudan - Core Schema

## Overview
Creates the data model for "نور السودان" (Nour Sudan), a services & business directory app.
The app has sign-in (email/phone + password + OTP), so all policies are owner-scoped to `authenticated`,
except categories/subcategories which are readable by everyone (anon + authenticated) since they form
the public directory structure, but only the Super Admin can modify them.

## New Tables

1. `profiles`
   - Extends `auth.users` with app-specific account data.
   - `id` (uuid, PK, references auth.users)
   - `full_name` (text) - display name / business name
   - `account_type` (enum: 'individual','business','professional','admin') - account role
   - `phone` (text) - personal phone
   - `business_phone` (text) - company phone
   - `email_contact` (text) - contact email (may differ from auth email)
   - `location_text` (text) - human-readable area/city
   - `lat` (numeric, nullable) - GPS latitude
   - `lng` (numeric, nullable) - GPS longitude
   - `avatar_url` (text, nullable)
   - `created_at` (timestamptz)

2. `categories`
   - Top-level directory sections (e.g. Hotels, Restaurants). Managed dynamically by Super Admin.
   - `id` (uuid, PK)
   - `name` (text) - Arabic display name
   - `slug` (text, unique) - url slug
   - `icon` (text) - lucide icon name
   - `sort_order` (int, default 0)
   - `created_at` (timestamptz)

3. `subcategories`
   - Child sections under a category.
   - `id` (uuid, PK)
   - `category_id` (uuid, FK -> categories)
   - `name` (text)
   - `slug` (text)
   - `icon` (text)
   - `sort_order` (int, default 0)
   - `created_at` (timestamptz)

4. `listings`
   - A business/service listing created by a provider (business/professional/individual).
   - `id` (uuid, PK)
   - `category_id` (uuid, FK -> categories)
   - `subcategory_id` (uuid, nullable, FK -> subcategories)
   - `owner_id` (uuid, FK -> auth.users) - the provider who owns it
   - `title` (text)
   - `description` (text)
   - `phone` (text)
   - `email_contact` (text, nullable)
   - `price` (numeric, nullable)
   - `location_text` (text, nullable)
   - `lat` (numeric, nullable)
   - `lng` (numeric, nullable)
   - `image_url` (text, nullable)
   - `is_active` (boolean, default true)
   - `created_at` (timestamptz)

## Security (RLS)
- `profiles`: each authenticated user can read all profiles (directory), but only update/insert their own.
- `categories` / `subcategories`: public read (anon + authenticated); only admin can write.
- `listings`: public read; owner can insert/update/delete their own.
- Admin write access on categories/subcategories is enforced via an `account_type = 'admin'` check on profiles.
*/

-- ---- profiles ----
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  account_type text NOT NULL DEFAULT 'individual'
    CHECK (account_type IN ('individual','business','professional','admin')),
  phone text DEFAULT '',
  business_phone text DEFAULT '',
  email_contact text DEFAULT '',
  location_text text DEFAULT '',
  lat numeric,
  lng numeric,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_profiles" ON profiles;
CREATE POLICY "read_all_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---- categories ----
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'Folder',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

-- ---- subcategories ----
CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  icon text NOT NULL DEFAULT 'Folder',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_subcategories" ON subcategories;
CREATE POLICY "public_read_subcategories" ON subcategories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_subcategories" ON subcategories;
CREATE POLICY "admin_insert_subcategories" ON subcategories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_subcategories" ON subcategories;
CREATE POLICY "admin_update_subcategories" ON subcategories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_subcategories" ON subcategories;
CREATE POLICY "admin_delete_subcategories" ON subcategories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

-- ---- listings ----
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  phone text DEFAULT '',
  email_contact text DEFAULT '',
  price numeric,
  location_text text DEFAULT '',
  lat numeric,
  lng numeric,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_listings" ON listings;
CREATE POLICY "public_read_listings" ON listings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_listing" ON listings;
CREATE POLICY "insert_own_listing" ON listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_listing" ON listings;
CREATE POLICY "update_own_listing" ON listings FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_listing" ON listings;
CREATE POLICY "delete_own_listing" ON listings FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
