-- Create character_assets table for caching ESI asset data
CREATE TABLE character_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  item_id BIGINT NOT NULL,
  location_id BIGINT NOT NULL,
  location_name TEXT,
  location_type TEXT,
  type_id INTEGER NOT NULL,
  type_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_singleton BOOLEAN DEFAULT false,
  is_blueprint_copy BOOLEAN,
  parent_item_id BIGINT,
  estimated_value NUMERIC,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id, item_id)
);

-- Enable RLS
ALTER TABLE character_assets ENABLE ROW LEVEL SECURITY;

-- Users can view their own character assets
CREATE POLICY "Users can view their own assets"
  ON character_assets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own character assets
CREATE POLICY "Users can insert their own assets"
  ON character_assets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own character assets
CREATE POLICY "Users can update their own assets"
  ON character_assets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own character assets
CREATE POLICY "Users can delete their own assets"
  ON character_assets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_character_assets_character_id ON character_assets(character_id);
CREATE INDEX idx_character_assets_user_id ON character_assets(user_id);
CREATE INDEX idx_character_assets_location_id ON character_assets(location_id);
CREATE INDEX idx_character_assets_type_id ON character_assets(type_id);

-- Insert asset-manager plugin
INSERT INTO plugins (plugin_id, name, description, version, author, enabled, is_system, metadata)
VALUES (
  'asset-manager',
  'Asset Manager',
  'Track and manage all character assets across locations with detailed inventory view',
  '1.0.0',
  'EVE Portal Aether',
  true,
  true,
  '{
    "category": "inventory",
    "requiredScopes": ["esi-assets.read_assets.v1", "esi-universe.read_structures.v1"],
    "refreshInterval": 21600,
    "icon": "package"
  }'::jsonb
)
ON CONFLICT (plugin_id) DO NOTHING;