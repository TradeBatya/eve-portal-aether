# Troubleshooting Guide

This guide covers common issues and their solutions for EVE Portal Aether.

## Token Management Issues

### Tokens Not Refreshing

**Symptoms:**
- 401 errors in ESI Monitor Dashboard
- "Token expired" messages
- Data failing to load after some time

**Solutions:**

1. **Check Cron Job Status:**
   - Open ESI Monitor Dashboard (`/esi-monitor`)
   - Verify "Last Token Refresh" timestamp is recent (<5 minutes)
   - Check for errors in token refresh logs

2. **Verify Cron Extension:**
   ```sql
   -- Check if pg_cron is enabled
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   
   -- Check scheduled jobs
   SELECT * FROM cron.job;
   ```

3. **Manual Token Refresh:**
   - Logout and login again to regenerate tokens
   - Check character scopes match required permissions
   - Verify refresh_token is not null in `esi_service_tokens`

4. **Check Token Expiry:**
   ```sql
   SELECT character_id, expires_at, 
          EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_until_expiry
   FROM esi_service_tokens
   ORDER BY expires_at ASC;
   ```

### Missing Scopes (403 Errors)

**Symptoms:**
- 403 errors for specific ESI endpoints
- "Missing required scope" messages
- Partial data loading (some tabs work, others don't)

**Solutions:**

1. **Re-authorize Character:**
   - Logout from Portal
   - Login again via EVE SSO
   - Ensure all required scopes are granted:
     - `esi-wallet.read_character_wallet.v1`
     - `esi-skills.read_skills.v1`
     - `esi-assets.read_assets.v1`
     - `esi-characters.read_contacts.v1`
     - `esi-contracts.read_character_contracts.v1`
     - `esi-industry.read_character_jobs.v1`
     - `esi-characters.read_loyalty.v1`

2. **Verify Scopes in Database:**
   ```sql
   SELECT character_id, scopes
   FROM esi_service_tokens
   WHERE character_id = YOUR_CHARACTER_ID;
   ```

## Performance Issues

### Slow Initial Load

**Symptoms:**
- Dashboard takes >5 seconds to load
- Blank screen after login
- Delayed data display

**Solutions:**

1. **Check Cache Preloading:**
   - Open browser DevTools → Console
   - Look for "Preloading character data" messages
   - Verify no errors during preload

2. **Verify Cache Hit Rate:**
   - Navigate to ESI Monitor Dashboard
   - Check "Cache Hit Rate" metric (should be >85%)
   - Low hit rate indicates cache issues

3. **Clear Browser Cache:**
   - Clear localStorage: `localStorage.clear()`
   - Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

4. **Check Database Cache:**
   ```sql
   -- Check cache size
   SELECT COUNT(*), 
          SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) as valid_entries
   FROM esi_service_cache;
   
   -- Clear expired cache
   DELETE FROM esi_service_cache WHERE expires_at < NOW();
   ```

### High Memory Usage

**Symptoms:**
- Browser tab consuming >500MB RAM
- Sluggish UI performance
- Browser warnings about memory

**Solutions:**

1. **Reduce Auto-Refresh Frequency:**
   - Disable auto-refresh in hooks where not needed
   - Increase refresh intervals for non-critical data

2. **Clear Memory Cache:**
   ```typescript
   // In browser console
   window.location.reload();
   ```

3. **Optimize Cache Size:**
   ```sql
   -- Remove low-priority old cache entries
   DELETE FROM esi_service_cache 
   WHERE priority < 5 
     AND last_accessed < NOW() - INTERVAL '24 hours';
   ```

## Data Sync Issues

### MemberAudit Data Not Updating

**Symptoms:**
- "Last synced" timestamp not updating
- Stale data in tabs
- Sync button not working

**Solutions:**

1. **Check Sync Status:**
   ```sql
   SELECT character_id, sync_status, sync_errors, last_update_at
   FROM member_audit_metadata
   WHERE character_id = YOUR_CHARACTER_ID;
   ```

2. **Retry Sync:**
   - Click "Sync Now" button in MemberAudit page
   - Wait for sync progress bar to complete
   - Check for error messages

3. **Verify Edge Function:**
   - Check `update-member-audit` function logs
   - Look for 420 (rate limit) or 503 (ESI down) errors
   - Verify function has correct environment variables

4. **Manual Data Refresh:**
   ```sql
   -- Reset sync status
   UPDATE member_audit_metadata
   SET sync_status = 'pending', sync_errors = NULL
   WHERE character_id = YOUR_CHARACTER_ID;
   ```

### Partial Sync (Some Tabs Empty)

**Symptoms:**
- Some MemberAudit tabs show data, others are empty
- Sync completes but some data missing
- Inconsistent data across tabs

**Solutions:**

1. **Check Module Errors:**
   ```sql
   SELECT character_id, sync_errors
   FROM member_audit_metadata
   WHERE character_id = YOUR_CHARACTER_ID;
   ```

2. **Verify Module Permissions:**
   - Missing scopes can cause partial sync
   - Re-authorize character with all scopes

3. **Check ESI Status:**
   - Navigate to Developer → ESI Status
   - Verify all required endpoints are operational
   - Wait for ESI recovery if endpoints are down

## ESI Rate Limiting (420 Errors)

**Symptoms:**
- Frequent 420 errors in logs
- Slow data updates
- "Rate limited" messages

**Solutions:**

1. **Reduce Request Frequency:**
   - Increase cache TTL for non-critical data
   - Disable unnecessary auto-refresh
   - Batch requests where possible

2. **Check Error Rate Limit:**
   ```sql
   SELECT endpoint, COUNT(*) as error_count
   FROM esi_service_request_logs
   WHERE status_code = 420
     AND accessed_at > NOW() - INTERVAL '1 hour'
   GROUP BY endpoint
   ORDER BY error_count DESC;
   ```

3. **Implement Backoff:**
   - System automatically retries with exponential backoff
   - Wait 1-2 minutes before manual retry
   - Check ESI Monitor for retry status

## Database Issues

### RLS Policy Errors

**Symptoms:**
- "Permission denied" errors
- Unable to access own data
- 403 errors from database

**Solutions:**

1. **Verify User Authentication:**
   ```sql
   SELECT auth.uid() as current_user_id;
   ```

2. **Check RLS Policies:**
   ```sql
   -- List policies for a table
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'member_audit_metadata';
   ```

3. **Temporary Disable RLS (Development Only):**
   ```sql
   ALTER TABLE member_audit_metadata DISABLE ROW LEVEL SECURITY;
   ```

### Connection Pool Exhausted

**Symptoms:**
- "Too many connections" errors
- Slow queries
- Timeouts

**Solutions:**

1. **Check Active Connections:**
   ```sql
   SELECT COUNT(*) FROM pg_stat_activity;
   ```

2. **Close Idle Connections:**
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
     AND state_change < NOW() - INTERVAL '5 minutes';
   ```

## Browser Console Errors

### "Failed to fetch" Errors

**Symptoms:**
- Network errors in console
- Data not loading
- Blank components

**Solutions:**

1. **Check Network Tab:**
   - Open DevTools → Network
   - Look for failed requests (red status)
   - Verify endpoint URLs are correct

2. **Verify CORS Settings:**
   - Supabase should handle CORS automatically
   - Check for incorrect custom headers

3. **Check Supabase Status:**
   - Verify `VITE_SUPABASE_URL` in .env
   - Test connection: `supabase.from('profiles').select('*').limit(1)`

### React Hydration Errors

**Symptoms:**
- "Hydration failed" warnings
- Mismatched content on load
- Flickering UI

**Solutions:**

1. **Clear Cache and Reload:**
   - Hard refresh browser
   - Clear localStorage
   - Restart dev server

2. **Check for SSR Issues:**
   - Verify no window/document usage in initial render
   - Use useEffect for client-side only code

## Getting Help

If issues persist:

1. **Collect Diagnostics:**
   - ESI Monitor Dashboard metrics
   - Browser console logs
   - Network request logs
   - Database error messages

2. **Check ESI Status:**
   - Visit ESI Status page in Developer section
   - Verify Discord/EVE API status

3. **Review Recent Changes:**
   - Check CHANGELOG.md for breaking changes
   - Review recent migrations
   - Verify environment variables

4. **Contact Support:**
   - Provide character ID and timestamp
   - Include error messages and screenshots
   - Describe steps to reproduce issue
