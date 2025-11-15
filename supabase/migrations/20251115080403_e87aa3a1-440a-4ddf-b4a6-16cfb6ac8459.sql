-- Create ESI Service tables for centralized ESI management
-- Cache table for all ESI responses
CREATE TABLE IF NOT EXISTS esi_service_cache (
    id BIGSERIAL PRIMARY KEY,
    cache_key VARCHAR(500) UNIQUE NOT NULL,
    endpoint VARCHAR(300) NOT NULL,
    character_id BIGINT,
    data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Token management table
CREATE TABLE IF NOT EXISTS esi_service_tokens (
    character_id BIGINT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ NOT NULL,
    scopes TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Universe names cache (stations, systems, types, etc)
CREATE TABLE IF NOT EXISTS esi_service_universe_names (
    id BIGINT PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Request logging for monitoring
CREATE TABLE IF NOT EXISTS esi_service_request_logs (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) DEFAULT 'GET',
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    user_agent VARCHAR(500),
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_esi_cache_key ON esi_service_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_esi_cache_expires ON esi_service_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_esi_cache_endpoint ON esi_service_cache(endpoint);
CREATE INDEX IF NOT EXISTS idx_esi_cache_character ON esi_service_cache(character_id);
CREATE INDEX IF NOT EXISTS idx_esi_tokens_expires ON esi_service_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_esi_universe_expires ON esi_service_universe_names(expires_at);
CREATE INDEX IF NOT EXISTS idx_esi_logs_character ON esi_service_request_logs(character_id);
CREATE INDEX IF NOT EXISTS idx_esi_logs_accessed ON esi_service_request_logs(accessed_at DESC);

-- RLS Policies
ALTER TABLE esi_service_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE esi_service_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE esi_service_universe_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE esi_service_request_logs ENABLE ROW LEVEL SECURITY;

-- Cache policies (system can manage)
CREATE POLICY "System can manage cache" ON esi_service_cache FOR ALL USING (true);

-- Token policies (users can only see their own)
CREATE POLICY "Users can view their own tokens" ON esi_service_tokens FOR SELECT USING (
  character_id IN (
    SELECT character_id FROM eve_characters WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage tokens" ON esi_service_tokens FOR ALL USING (true);

-- Universe names (public read)
CREATE POLICY "Anyone can view universe names" ON esi_service_universe_names FOR SELECT USING (true);
CREATE POLICY "System can manage universe names" ON esi_service_universe_names FOR ALL USING (true);

-- Request logs (users can see their own)
CREATE POLICY "Users can view their own logs" ON esi_service_request_logs FOR SELECT USING (
  character_id IN (
    SELECT character_id FROM eve_characters WHERE user_id = auth.uid()
  ) OR character_id IS NULL
);

CREATE POLICY "System can insert logs" ON esi_service_request_logs FOR INSERT WITH CHECK (true);

-- Cleanup function for old cache entries
CREATE OR REPLACE FUNCTION cleanup_esi_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM esi_service_cache WHERE expires_at < NOW() - INTERVAL '7 days';
  DELETE FROM esi_service_request_logs WHERE accessed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;