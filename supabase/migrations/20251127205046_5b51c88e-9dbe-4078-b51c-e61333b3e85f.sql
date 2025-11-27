-- Create member_audit_assets table for storing character assets
CREATE TABLE IF NOT EXISTS member_audit_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  item_id BIGINT NOT NULL,
  type_id INTEGER NOT NULL,
  type_name TEXT,
  location_id BIGINT NOT NULL,
  location_name TEXT,
  location_type TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_singleton BOOLEAN DEFAULT false,
  is_blueprint_copy BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id, item_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_audit_assets_character ON member_audit_assets(character_id);
CREATE INDEX IF NOT EXISTS idx_member_audit_assets_location ON member_audit_assets(location_id);
CREATE INDEX IF NOT EXISTS idx_member_audit_assets_type ON member_audit_assets(type_id);

-- Enable RLS
ALTER TABLE member_audit_assets ENABLE ROW LEVEL SECURITY;

-- Users can view their own assets
CREATE POLICY "Users can view their own assets" ON member_audit_assets
  FOR SELECT USING (
    character_id IN (
      SELECT character_id FROM eve_characters WHERE user_id = auth.uid()
    )
  );

-- Users can manage their own assets
CREATE POLICY "Users can manage their own assets" ON member_audit_assets
  FOR ALL USING (
    character_id IN (
      SELECT character_id FROM eve_characters WHERE user_id = auth.uid()
    )
  );

-- Admins can view all assets
CREATE POLICY "Admins can view all assets" ON member_audit_assets
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role)
  );