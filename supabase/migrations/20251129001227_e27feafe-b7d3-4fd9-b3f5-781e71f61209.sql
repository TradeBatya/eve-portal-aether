-- PHASE 1: Complete Asset Value Removal

-- Step 1: Remove estimated_value from member_audit_assets
ALTER TABLE member_audit_assets 
DROP COLUMN IF EXISTS estimated_value CASCADE;

-- Step 2: Remove estimated_value from character_assets
ALTER TABLE character_assets 
DROP COLUMN IF EXISTS estimated_value CASCADE;

-- Step 3: Remove total_assets_value from member_audit_metadata
ALTER TABLE member_audit_metadata 
DROP COLUMN IF EXISTS total_assets_value CASCADE;

-- Step 4: Drop market_prices_cache table completely
DROP TABLE IF EXISTS market_prices_cache CASCADE;

-- Verification queries
COMMENT ON TABLE member_audit_assets IS 'Assets table - value estimation removed as per Phase 1';
COMMENT ON TABLE character_assets IS 'Character assets - value estimation removed as per Phase 1';
COMMENT ON TABLE member_audit_metadata IS 'Metadata table - total_assets_value removed as per Phase 1';