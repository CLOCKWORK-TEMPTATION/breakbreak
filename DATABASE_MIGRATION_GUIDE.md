-- Database Migration Guide for Break Break
-- This file documents the database schema setup

-- Note: If using Prisma, run: npx prisma migrate dev --name init
-- This will auto-generate migrations from schema.prisma

-- ============================================
-- Manual Migration (if needed)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE "Role" AS ENUM ('DIRECTOR', 'CREW', 'RUNNER');
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'LOCKED', 'DELIVERING', 'COMPLETED');

-- ============================================
-- Table: projects
-- ============================================
CREATE TABLE "projects" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "active_location" JSONB,  -- {lat: number, lng: number}
  "access_token_secret" TEXT NOT NULL,
  "budget_config" JSONB,    -- {daily_limit: number, per_person_limit: number}
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "project_id" UUID NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CREW',
  "user_hash" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
);

CREATE INDEX "users_project_id_idx" ON "users"("project_id");

-- ============================================
-- Table: vendors
-- ============================================
CREATE TABLE "vendors" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "fixed_location" JSONB NOT NULL,  -- {lat: number, lng: number}
  "is_mobile" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: daily_sessions
-- ============================================
CREATE TABLE "daily_sessions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "project_id" UUID NOT NULL,
  "center_point" JSONB NOT NULL,  -- {lat: number, lng: number}
  "status" "SessionStatus" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
);

CREATE INDEX "daily_sessions_project_id_idx" ON "daily_sessions"("project_id");
CREATE INDEX "daily_sessions_status_idx" ON "daily_sessions"("status");

-- ============================================
-- Table: menu_items
-- ============================================
CREATE TABLE "menu_items" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "vendor_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10, 2) NOT NULL,
  "available" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE
);

CREATE INDEX "menu_items_vendor_id_idx" ON "menu_items"("vendor_id");
CREATE INDEX "menu_items_available_idx" ON "menu_items"("available");

-- ============================================
-- Table: orders
-- ============================================
CREATE TABLE "orders" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "session_id" UUID NOT NULL,
  "user_hash" TEXT NOT NULL,
  "items" JSONB NOT NULL,  -- [{menuItemId, quantity, name, price}]
  "cost_internal" DECIMAL(10, 2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("session_id") REFERENCES "daily_sessions"("id") ON DELETE CASCADE
);

CREATE INDEX "orders_session_id_idx" ON "orders"("session_id");
CREATE INDEX "orders_user_hash_idx" ON "orders"("user_hash");

-- ============================================
-- Seed Data (Optional - for testing)
-- ============================================

-- Sample Project
INSERT INTO "projects" ("id", "name", "access_token_secret", "budget_config")
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Desert Film Production',
  'sample-secret-change-in-production',
  '{"daily_limit": 5000, "per_person_limit": 50}'::jsonb
);

-- Sample Vendors
INSERT INTO "vendors" ("name", "fixed_location", "is_mobile")
VALUES 
  ('Desert Food Truck', '{"lat": 24.7140, "lng": 46.6760}'::jsonb, true),
  ('Oasis Cafe', '{"lat": 24.7150, "lng": 46.6755}'::jsonb, false),
  ('Nomad Kitchen', '{"lat": 24.7130, "lng": 46.6765}'::jsonb, true);

-- Sample Menu Items
INSERT INTO "menu_items" ("vendor_id", "name", "description", "price", "available")
SELECT 
  v.id,
  items.name,
  items.description,
  items.price,
  true
FROM "vendors" v
CROSS JOIN (
  VALUES 
    ('Shawarma Wrap', 'Chicken shawarma with garlic sauce', 25.00),
    ('Falafel Plate', 'Fresh falafel with tahini', 20.00),
    ('Mixed Grill', 'Assorted grilled meats', 45.00),
    ('Arabic Coffee', 'Traditional coffee', 10.00),
    ('Fresh Juice', 'Seasonal fruit juice', 15.00)
) AS items(name, description, price)
WHERE v.name = 'Desert Food Truck'
LIMIT 5;

-- ============================================
-- Database Functions (Optional - for convenience)
-- ============================================

-- Function to calculate distance between two points (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  R CONSTANT DOUBLE PRECISION := 6371000; -- Earth radius in meters
  phi1 DOUBLE PRECISION;
  phi2 DOUBLE PRECISION;
  delta_phi DOUBLE PRECISION;
  delta_lambda DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  phi1 := radians(lat1);
  phi2 := radians(lat2);
  delta_phi := radians(lat2 - lat1);
  delta_lambda := radians(lng2 - lng1);
  
  a := sin(delta_phi / 2) * sin(delta_phi / 2) +
       cos(phi1) * cos(phi2) *
       sin(delta_lambda / 2) * sin(delta_lambda / 2);
  
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Indexes for Performance (Additional)
-- ============================================

-- Index for faster JSON queries (if needed)
-- CREATE INDEX "projects_active_location_idx" ON "projects" USING GIN ("active_location");
-- CREATE INDEX "vendors_fixed_location_idx" ON "vendors" USING GIN ("fixed_location");

-- ============================================
-- Row Level Security (RLS) - Future Enhancement
-- ============================================

-- Enable RLS on tables
-- ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;

-- Create policies for project isolation
-- CREATE POLICY "users_project_isolation" ON "users"
--   USING ("project_id" = current_setting('app.current_project_id')::uuid);

-- CREATE POLICY "orders_project_isolation" ON "orders"
--   USING ("session_id" IN (
--     SELECT "id" FROM "daily_sessions" 
--     WHERE "project_id" = current_setting('app.current_project_id')::uuid
--   ));

-- ============================================
-- Backup and Maintenance
-- ============================================

-- Regular backup command (run externally):
-- pg_dump -U username -d breakapp_db -F c -b -v -f /path/to/backup/breakapp_$(date +%Y%m%d).backup

-- Restore command:
-- pg_restore -U username -d breakapp_db -v /path/to/backup/breakapp_20260103.backup

-- ============================================
-- Performance Monitoring
-- ============================================

-- Check table sizes
-- SELECT 
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries
-- SELECT query, calls, total_time, mean_time
-- FROM pg_stat_statements
-- ORDER BY mean_time DESC
-- LIMIT 10;

-- ============================================
-- Notes
-- ============================================

-- 1. JSON vs PostGIS:
--    Currently using JSONB for location data for simplicity.
--    For production with >1000 vendors, consider migrating to PostGIS:
--    - CREATE EXTENSION postgis;
--    - ALTER TABLE vendors ADD COLUMN location GEOGRAPHY(Point, 4326);
--    - CREATE INDEX ON vendors USING GIST(location);

-- 2. Prisma Migration:
--    Preferred method is to use Prisma CLI:
--    - npx prisma migrate dev --name init
--    - npx prisma generate
--    This ensures schema.prisma and database stay in sync

-- 3. Production Considerations:
--    - Enable SSL connections
--    - Set up connection pooling (e.g., pgBouncer)
--    - Configure regular backups
--    - Monitor query performance
--    - Implement proper RLS for multi-tenancy

-- ============================================
-- End of Migration Guide
-- ============================================
