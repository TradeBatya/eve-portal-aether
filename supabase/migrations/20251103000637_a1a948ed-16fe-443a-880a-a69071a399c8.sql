-- Add corporation fields to eve_characters table
ALTER TABLE public.eve_characters 
ADD COLUMN IF NOT EXISTS corporation_id bigint,
ADD COLUMN IF NOT EXISTS corporation_name text;