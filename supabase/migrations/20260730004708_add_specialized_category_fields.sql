/*
# Nour Sudan - Specialized Category Fields

## Overview
Adds category-specific columns to listings for specialized templates:
- Pharmacies: 24/7 availability flag
- Event Halls: seating capacity and facilities checklist
- Craftsmen/Drivers: ratings (average + count) for service quality display

## Modified Tables

### `listings`
- `is_24_7` (boolean, default false) — pharmacy open 24/7 badge
- `capacity` (int, nullable) — event hall seating capacity
- `facilities` (text[], default '{}') — event hall facilities checklist (parking, ac, catering, sound, etc.)
- `rating_avg` (numeric, default 0) — average rating (0-5) for craftsmen/drivers
- `rating_count` (int, default 0) — number of ratings received

## Security
No policy changes — existing listing policies already cover these columns.
*/

ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_24_7 boolean NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS capacity int;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS facilities text[] NOT NULL DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rating_avg numeric NOT NULL DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rating_count int NOT NULL DEFAULT 0;