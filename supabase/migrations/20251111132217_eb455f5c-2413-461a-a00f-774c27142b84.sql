-- Add ESI fields to eve_characters table
ALTER TABLE eve_characters 
ADD COLUMN IF NOT EXISTS alliance_id bigint,
ADD COLUMN IF NOT EXISTS alliance_name text,
ADD COLUMN IF NOT EXISTS wallet_balance numeric,
ADD COLUMN IF NOT EXISTS security_status numeric,
ADD COLUMN IF NOT EXISTS location_system_id bigint,
ADD COLUMN IF NOT EXISTS location_system_name text,
ADD COLUMN IF NOT EXISTS ship_type_id bigint,
ADD COLUMN IF NOT EXISTS ship_type_name text,
ADD COLUMN IF NOT EXISTS last_refreshed_at timestamp with time zone;