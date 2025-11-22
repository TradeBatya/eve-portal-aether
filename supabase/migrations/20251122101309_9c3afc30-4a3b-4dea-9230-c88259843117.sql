-- Add indexes for ESI Core performance optimization

-- Index for cache lookups by key
CREATE INDEX IF NOT EXISTS idx_esi_cache_key 
ON esi_service_cache(cache_key);

-- Index for cache lookups by character and endpoint
CREATE INDEX IF NOT EXISTS idx_esi_cache_character_endpoint 
ON esi_service_cache(character_id, endpoint);

-- Index for cache tag-based invalidation
CREATE INDEX IF NOT EXISTS idx_esi_cache_tags 
ON esi_service_cache USING GIN(tags);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_esi_cache_expires 
ON esi_service_cache(expires_at);

-- Index for cache priority-based eviction
CREATE INDEX IF NOT EXISTS idx_esi_cache_priority_access 
ON esi_service_cache(priority DESC, last_accessed DESC);

-- Index for request log endpoint analysis
CREATE INDEX IF NOT EXISTS idx_esi_logs_endpoint 
ON esi_service_request_logs(endpoint, accessed_at DESC);

-- Index for request log character analysis
CREATE INDEX IF NOT EXISTS idx_esi_logs_character 
ON esi_service_request_logs(character_id, accessed_at DESC);

-- Index for request log status code analysis
CREATE INDEX IF NOT EXISTS idx_esi_logs_status 
ON esi_service_request_logs(status_code, accessed_at DESC);

-- Index for token expiration checks
CREATE INDEX IF NOT EXISTS idx_esi_tokens_expires 
ON esi_service_tokens(expires_at, auto_refresh_enabled);

-- Index for universe names cache lookups
CREATE INDEX IF NOT EXISTS idx_universe_names_id 
ON esi_service_universe_names(id);

-- Index for universe names expiration
CREATE INDEX IF NOT EXISTS idx_universe_names_expires 
ON esi_service_universe_names(expires_at);

-- Index for member audit metadata lookups
CREATE INDEX IF NOT EXISTS idx_member_audit_character 
ON member_audit_metadata(character_id, last_update_at DESC);

-- Index for member audit skills lookups
CREATE INDEX IF NOT EXISTS idx_member_audit_skills_char 
ON member_audit_skills(character_id, skill_id);

-- Index for member audit wallet journal
CREATE INDEX IF NOT EXISTS idx_member_audit_journal_char_date 
ON member_audit_wallet_journal(character_id, date DESC);

-- Index for member audit wallet transactions
CREATE INDEX IF NOT EXISTS idx_member_audit_transactions_char_date 
ON member_audit_wallet_transactions(character_id, date DESC);

-- Database function to increment token validation failures
CREATE OR REPLACE FUNCTION increment_token_failures(char_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE esi_service_tokens
  SET 
    validation_failures = COALESCE(validation_failures, 0) + 1,
    auto_refresh_enabled = CASE 
      WHEN COALESCE(validation_failures, 0) + 1 >= 3 THEN false
      ELSE auto_refresh_enabled
    END,
    updated_at = NOW()
  WHERE character_id = char_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;