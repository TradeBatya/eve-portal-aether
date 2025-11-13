-- Create cache table for universe names
CREATE TABLE IF NOT EXISTS public.member_audit_universe_names (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_universe_names_category ON public.member_audit_universe_names(category);

-- Enable RLS
ALTER TABLE public.member_audit_universe_names ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read from cache
CREATE POLICY "Anyone can view universe names cache"
ON public.member_audit_universe_names
FOR SELECT
USING (true);

-- Allow authenticated users to insert/update cache
CREATE POLICY "System can manage universe names cache"
ON public.member_audit_universe_names
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add location and ship fields to member_audit_metadata
ALTER TABLE public.member_audit_metadata
ADD COLUMN IF NOT EXISTS location_id BIGINT,
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS location_type TEXT,
ADD COLUMN IF NOT EXISTS solar_system_id INTEGER,
ADD COLUMN IF NOT EXISTS solar_system_name TEXT,
ADD COLUMN IF NOT EXISTS ship_type_id INTEGER,
ADD COLUMN IF NOT EXISTS ship_type_name TEXT,
ADD COLUMN IF NOT EXISTS ship_name TEXT;