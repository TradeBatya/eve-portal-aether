-- Improve esi_service_cache table with new fields
ALTER TABLE esi_service_cache ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;
ALTER TABLE esi_service_cache ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE esi_service_cache ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_esi_cache_tags ON esi_service_cache USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_esi_cache_priority ON esi_service_cache(priority DESC);
CREATE INDEX IF NOT EXISTS idx_esi_cache_character_endpoint ON esi_service_cache(character_id, endpoint);

-- Enhance esi_service_request_logs
ALTER TABLE esi_service_request_logs ADD COLUMN IF NOT EXISTS request_body JSONB;
ALTER TABLE esi_service_request_logs ADD COLUMN IF NOT EXISTS response_body JSONB;
ALTER TABLE esi_service_request_logs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE esi_service_request_logs ADD COLUMN IF NOT EXISTS cache_hit BOOLEAN DEFAULT false;
ALTER TABLE esi_service_request_logs ADD COLUMN IF NOT EXISTS from_queue BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_esi_request_logs_character_date ON esi_service_request_logs(character_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_esi_request_logs_endpoint_status ON esi_service_request_logs(endpoint, status_code);

-- Add token sync tracking
ALTER TABLE esi_service_tokens ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMPTZ;
ALTER TABLE esi_service_tokens ADD COLUMN IF NOT EXISTS validation_failures INTEGER DEFAULT 0;
ALTER TABLE esi_service_tokens ADD COLUMN IF NOT EXISTS auto_refresh_enabled BOOLEAN DEFAULT true;

-- Function to cleanup old cache entries
CREATE OR REPLACE FUNCTION cleanup_esi_cache_old()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired cache older than 7 days
  DELETE FROM esi_service_cache 
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  -- Delete low-priority cache with low access count
  DELETE FROM esi_service_cache 
  WHERE priority = 0 
    AND access_count < 5 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Function to update cache access stats
CREATE OR REPLACE FUNCTION update_cache_access_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.access_count = OLD.access_count + 1;
  NEW.last_accessed = NOW();
  RETURN NEW;
END;
$$;