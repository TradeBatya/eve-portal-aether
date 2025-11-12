-- Install asset-manager plugin for all existing users
INSERT INTO user_plugins (user_id, plugin_id, enabled, settings)
SELECT 
  p.id,
  pl.id,
  true,
  '{}'::jsonb
FROM profiles p
CROSS JOIN plugins pl
WHERE pl.plugin_id = 'asset-manager'
  AND pl.is_system = true
  AND NOT EXISTS (
    SELECT 1 FROM user_plugins up 
    WHERE up.user_id = p.id 
    AND up.plugin_id = pl.id
  );