-- Synchronize scopes from eve_characters to esi_service_tokens
-- Reset validation failures and enable auto-refresh for all tokens
UPDATE esi_service_tokens est
SET 
  scopes = ec.scopes,
  validation_failures = 0,
  auto_refresh_enabled = true,
  updated_at = NOW()
FROM eve_characters ec
WHERE est.character_id = ec.character_id
  AND ec.scopes IS NOT NULL
  AND array_length(ec.scopes, 1) > 0;