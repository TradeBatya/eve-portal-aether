-- Add index for better performance on active pings
CREATE INDEX IF NOT EXISTS idx_ping_notifications_active 
ON public.ping_notifications(is_active, expires_at) 
WHERE is_active = true;

-- Add index for better performance on active intel
CREATE INDEX IF NOT EXISTS idx_intel_reports_active 
ON public.intel_reports(is_active, expires_at) 
WHERE is_active = true;