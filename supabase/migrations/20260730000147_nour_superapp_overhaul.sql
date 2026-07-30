/*
# Nour Sudan Super-App Overhaul

## Overview
Transforms the basic directory app into a full super-app ecosystem across all 18 categories.
Adds: driver role, operational status, delivery/payment fields, product/offer catalogs,
wallet & monetization system, ID verification workflow, and admin moderation support.

## 1. Modified Tables

### `profiles`
- `account_type` CHECK constraint expanded to include 'driver' (Transporter/Driver role).
- `is_verified` (boolean, default false) — receives Verified Badge after admin approval.
- `is_blocked` (boolean, default false) — admin can block a user.

### `listings`
- `is_open` (boolean, default true) — live operational status: Open/Closed or Available/Busy.
- `delivery_available` (boolean, default false) — delivery or no delivery.
- `service_radius` (numeric, nullable) — service radius in km on map.
- `payment_methods` (text[], default '{}') — accepted channels: cash, card, wallet, bank.
- `whatsapp` (text, default '') — direct WhatsApp number.
- `is_hidden_by_admin` (boolean, default false) — admin can hide a listing without deleting it.

## 2. New Tables

### `products`
- Catalog items, services, menu items, packages, or special discount offers attached to a listing.
- `id` (uuid, PK)
- `listing_id` (uuid, FK -> listings, CASCADE)
- `name` (text)
- `description` (text)
- `price` (numeric, nullable)
- `image_url` (text, nullable)
- `is_offer` (boolean, default false) — marks discount/special offer items.
- `created_at` (timestamptz)

### `wallets`
- Wallet balance tracking for drivers and craftsmen (platform fee deduction).
- `id` (uuid, PK)
- `user_id` (uuid, FK -> auth.users, CASCADE) — unique per user.
- `balance` (numeric, default 0)
- `updated_at` (timestamptz)

### `wallet_transactions`
- Transaction log for wallet top-ups and platform fee deductions.
- `id` (uuid, PK)
- `wallet_id` (uuid, FK -> wallets, CASCADE)
- `amount` (numeric) — positive for top-up, negative for fee deduction.
- `type` (text) — 'topup' | 'fee' | 'adjustment'
- `description` (text)
- `created_at` (timestamptz)

### `verifications`
- ID submission workflow for craftsmen/drivers/businesses to request Verified Badge.
- `id` (uuid, PK)
- `user_id` (uuid, FK -> auth.users, CASCADE)
- `id_document_url` (text) — uploaded ID photo.
- `status` (text, default 'pending') — 'pending' | 'approved' | 'rejected'.
- `submitted_at` (timestamptz)
- `reviewed_at` (timestamptz, nullable)

## 3. Security (RLS)
- `products`: public read; owner can insert/update/delete their own (via listing ownership).
- `wallets`: owner can read their own wallet; admin can read all.
- `wallet_transactions`: owner can read their own; admin can read all.
- `verifications`: owner can read/insert their own; admin can read/update all.
- `listings`: admin can update (hide) any listing via account_type='admin' check.
- `profiles`: admin can update any profile (verify/block).
*/

-- ---- profiles: expand account_type + verification/block flags ----
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('individual','business','professional','driver','admin'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- ---- listings: operational + admin moderation fields ----
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_open boolean NOT NULL DEFAULT true;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_available boolean NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS service_radius numeric;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS payment_methods text[] NOT NULL DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS whatsapp text NOT NULL DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_hidden_by_admin boolean NOT NULL DEFAULT false;

-- ---- products ----
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric,
  image_url text,
  is_offer boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_insert_products" ON products;
CREATE POLICY "owner_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = products.listing_id AND l.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_update_products" ON products;
CREATE POLICY "owner_update_products" ON products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = products.listing_id AND l.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = products.listing_id AND l.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_delete_products" ON products;
CREATE POLICY "owner_delete_products" ON products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = products.listing_id AND l.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_products_listing ON products(listing_id);

-- ---- wallets ----
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_wallet" ON wallets;
CREATE POLICY "read_own_wallet" ON wallets FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "admin_insert_wallets" ON wallets;
CREATE POLICY "admin_insert_wallets" ON wallets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_wallets" ON wallets;
CREATE POLICY "admin_update_wallets" ON wallets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

-- ---- wallet_transactions ----
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL DEFAULT 'adjustment',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_transactions" ON wallet_transactions;
CREATE POLICY "read_own_transactions" ON wallet_transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "admin_insert_transactions" ON wallet_transactions;
CREATE POLICY "admin_insert_transactions" ON wallet_transactions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);

-- ---- verifications ----
CREATE TABLE IF NOT EXISTS verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_document_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_verifications" ON verifications;
CREATE POLICY "read_own_verifications" ON verifications FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_verification" ON verifications;
CREATE POLICY "insert_own_verification" ON verifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_verifications" ON verifications;
CREATE POLICY "admin_update_verifications" ON verifications FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

-- ---- listings: admin can update (hide) any listing ----
DROP POLICY IF EXISTS "update_own_listing" ON listings;
CREATE POLICY "update_own_listing" ON listings FOR UPDATE
  TO authenticated USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  ) WITH CHECK (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );

-- ---- profiles: admin can update any profile (verify/block) ----
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  ) WITH CHECK (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.account_type = 'admin')
  );