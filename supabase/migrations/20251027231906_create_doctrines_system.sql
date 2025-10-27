-- Ship Doctrines and Fittings System
--
-- 1. New Tables
--    - doctrine_categories: Categories for grouping doctrines (HAC, Armor, Shield, Black Ops, etc.)
--    - ship_doctrines: Main doctrine records with metadata, cost estimates, and activity status
--    - ship_fittings: Individual ship fittings within doctrines with EFT format and required skills
--    - doctrine_tags: Flexible tagging system for doctrines (Nullsec, Alpha-friendly, etc.)
--
-- 2. Security
--    - Enable RLS on all tables
--    - Public read access for active doctrines (guest visitors can browse)
--    - Authenticated users can view all doctrines including archived
--    - Admin-only write access for creating, updating, and deleting doctrines
--
-- 3. Features
--    - Cost tracking for individual fittings and entire doctrines
--    - Skill requirements stored as JSONB for flexibility
--    - Categories with custom icons and sort order
--    - Tags for advanced filtering and organization

-- Create doctrine_categories table
CREATE TABLE IF NOT EXISTS doctrine_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ship_doctrines table
CREATE TABLE IF NOT EXISTS ship_doctrines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES doctrine_categories(id) ON DELETE SET NULL,
  primary_ship text NOT NULL,
  fleet_type text,
  difficulty text DEFAULT 'intermediate',
  estimated_cost bigint DEFAULT 0,
  image_url text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ship_fittings table
CREATE TABLE IF NOT EXISTS ship_fittings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctrine_id uuid REFERENCES ship_doctrines(id) ON DELETE CASCADE,
  ship_type text NOT NULL,
  role text DEFAULT 'dps',
  eft_fitting text NOT NULL,
  description text,
  required_skills jsonb DEFAULT '[]'::jsonb,
  estimated_cost bigint DEFAULT 0,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create doctrine_tags table
CREATE TABLE IF NOT EXISTS doctrine_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctrine_id uuid REFERENCES ship_doctrines(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(doctrine_id, tag)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ship_doctrines_category ON ship_doctrines(category_id);
CREATE INDEX IF NOT EXISTS idx_ship_doctrines_active ON ship_doctrines(is_active);
CREATE INDEX IF NOT EXISTS idx_ship_fittings_doctrine ON ship_fittings(doctrine_id);
CREATE INDEX IF NOT EXISTS idx_doctrine_tags_doctrine ON doctrine_tags(doctrine_id);
CREATE INDEX IF NOT EXISTS idx_doctrine_tags_tag ON doctrine_tags(tag);

-- Enable Row Level Security
ALTER TABLE doctrine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ship_doctrines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ship_fittings ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctrine_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctrine_categories
CREATE POLICY "Anyone can view doctrine categories"
  ON doctrine_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert doctrine categories"
  ON doctrine_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update doctrine categories"
  ON doctrine_categories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete doctrine categories"
  ON doctrine_categories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ship_doctrines
CREATE POLICY "Anyone can view active doctrines"
  ON ship_doctrines FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all doctrines"
  ON ship_doctrines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert doctrines"
  ON ship_doctrines FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update doctrines"
  ON ship_doctrines FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete doctrines"
  ON ship_doctrines FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ship_fittings
CREATE POLICY "Anyone can view fittings of active doctrines"
  ON ship_fittings FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM ship_doctrines
      WHERE ship_doctrines.id = ship_fittings.doctrine_id
      AND ship_doctrines.is_active = true
    )
  );

CREATE POLICY "Authenticated users can view all fittings"
  ON ship_fittings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert fittings"
  ON ship_fittings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update fittings"
  ON ship_fittings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete fittings"
  ON ship_fittings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for doctrine_tags
CREATE POLICY "Anyone can view tags of active doctrines"
  ON doctrine_tags FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM ship_doctrines
      WHERE ship_doctrines.id = doctrine_tags.doctrine_id
      AND ship_doctrines.is_active = true
    )
  );

CREATE POLICY "Authenticated users can view all tags"
  ON doctrine_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert tags"
  ON doctrine_tags FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tags"
  ON doctrine_tags FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO doctrine_categories (name, description, icon, sort_order) VALUES
  ('HAC Fleet', 'Heavy Assault Cruiser doctrines for medium-range engagements', 'shield', 1),
  ('Battleship', 'Heavy battleship doctrines for structure bashes and large fleets', 'anchor', 2),
  ('Shield Fleet', 'Shield-tanked fleet compositions', 'shield', 3),
  ('Armor Fleet', 'Armor-tanked fleet compositions', 'heart', 4),
  ('Black Ops', 'Covert operations and stealth bombing', 'eye-off', 5),
  ('Logistics', 'Support and transportation doctrines', 'truck', 6),
  ('Alpha Strike', 'High-alpha damage doctrines', 'zap', 7),
  ('Skirmish', 'Fast mobile doctrines for hit-and-run tactics', 'wind', 8)
ON CONFLICT DO NOTHING;