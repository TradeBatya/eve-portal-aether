-- Phase 6: Add estimated_value column to member_audit_assets
ALTER TABLE member_audit_assets 
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC DEFAULT 0;

-- Create market prices cache table
CREATE TABLE IF NOT EXISTS market_prices_cache (
  type_id INTEGER PRIMARY KEY,
  average_price NUMERIC DEFAULT 0,
  adjusted_price NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_market_prices_type ON market_prices_cache(type_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_updated ON market_prices_cache(last_updated);

-- Enable RLS
ALTER TABLE market_prices_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies: Public read access, system can update
CREATE POLICY "Anyone can read market prices" ON market_prices_cache 
  FOR SELECT 
  USING (true);

CREATE POLICY "System can manage market prices" ON market_prices_cache 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Phase 9: Fix scopes synchronization for character 2122961721
UPDATE esi_service_tokens 
SET 
  scopes = (SELECT scopes FROM eve_characters WHERE character_id = 2122961721),
  validation_failures = 0,
  auto_refresh_enabled = true,
  last_validated_at = now()
WHERE character_id = 2122961721;