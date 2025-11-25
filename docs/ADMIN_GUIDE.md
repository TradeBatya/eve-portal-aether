# Administrator Guide

This guide is for administrators managing EVE Portal Aether installation and monitoring system health.

## ESI Monitor Dashboard

The ESI Monitor Dashboard (`/esi-monitor`) provides real-time insights into ESI service health, performance, and usage.

### Accessing the Dashboard

1. Navigate to Developer → ESI Monitor
2. Dashboard requires developer/admin permissions
3. Auto-refreshes every 30 seconds

### Key Metrics

#### Service Health

**ESI Service Status**
- 🟢 Green: All systems operational
- 🟡 Yellow: Degraded performance (elevated error rate)
- 🔴 Red: Service disruption (>10% error rate)

**Token Refresh Status**
- Shows last successful token refresh timestamp
- Should update every 5 minutes via Cron
- Red indicator if >10 minutes since last refresh

#### Performance Metrics

**Total Requests (24h)**
- Total number of ESI API calls in last 24 hours
- Trend indicator shows increase/decrease vs previous period
- High volume (>10,000/day) may indicate inefficient caching

**Cache Hit Rate**
- Percentage of requests served from cache
- **Target:** >85% for optimal performance
- Low hit rate (<70%) indicates:
  - Inadequate cache TTL configuration
  - Too many unique requests
  - Cache invalidation issues

**Average Response Time**
- Mean response time for all ESI requests
- **Target:** <500ms
- Breakdown:
  - <200ms: Excellent (cached responses)
  - 200-500ms: Good (fresh ESI calls)
  - 500ms-2s: Acceptable (complex queries)
  - >2s: Poor (investigate bottlenecks)

**Error Rate**
- Percentage of failed requests in last 24 hours
- **Target:** <5%
- Common causes:
  - 401: Token expiration (check token refresh)
  - 403: Missing scopes (user re-authorization needed)
  - 420: Rate limiting (reduce request frequency)
  - 503/504: ESI downtime (wait for recovery)

#### Token Management

**Active Tokens**
- Number of characters with valid tokens
- Shows tokens expiring in next 60 minutes (warning)
- Tokens expired in last 24 hours

**Failed Validations (24h)**
- Count of token validation failures
- High count indicates systematic issue
- Check token refresh Cron job status

### Request Logs Table

Real-time log of ESI requests with:
- **Timestamp**: When request was made
- **Endpoint**: ESI endpoint called
- **Character**: Character ID making request
- **Status**: HTTP status code
- **Cache Hit**: Whether served from cache
- **Response Time**: Duration in milliseconds

**Filtering Logs:**
- Click status badges to filter by status code
- Click "Cache Hit" to show only cached requests
- Use search bar to filter by endpoint

### Cache Analytics

**Cache Performance**
- Total cache entries
- Valid (non-expired) entries
- Cache size estimation
- Oldest entry age

**Cache Distribution**
- Breakdown by endpoint type
- Priority distribution
- Access frequency histogram

**Cache Efficiency**
- Hit/Miss ratio by endpoint
- Average TTL utilization
- Eviction rate

## Performance Tuning

### Optimizing Cache Hit Rate

1. **Analyze Low Hit Rate Endpoints:**
   ```sql
   SELECT endpoint, 
          COUNT(*) as total_requests,
          SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
          ROUND(100.0 * SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / COUNT(*), 2) as hit_rate
   FROM esi_service_request_logs
   WHERE accessed_at > NOW() - INTERVAL '24 hours'
   GROUP BY endpoint
   HAVING COUNT(*) > 10
   ORDER BY hit_rate ASC
   LIMIT 10;
   ```

2. **Adjust TTL for Low-Hit Endpoints:**
   - Edit `CACHE_TTL` in `src/services/esi/CacheManager.ts`
   - Increase TTL for stable data (universe names, type info)
   - Keep low TTL for volatile data (location, wallet balance)

3. **Implement Request Deduplication:**
   - Enable request batching for similar endpoints
   - Use tag-based cache invalidation
   - Preload critical data on login

### Reducing Response Time

1. **Identify Slow Endpoints:**
   ```sql
   SELECT endpoint,
          COUNT(*) as request_count,
          AVG(response_time_ms) as avg_response_time,
          MAX(response_time_ms) as max_response_time
   FROM esi_service_request_logs
   WHERE accessed_at > NOW() - INTERVAL '24 hours'
     AND cache_hit = false
   GROUP BY endpoint
   ORDER BY avg_response_time DESC
   LIMIT 10;
   ```

2. **Optimize Database Queries:**
   - Ensure proper indexes exist
   - Use EXPLAIN ANALYZE for slow queries
   - Consider materialized views for complex aggregations

3. **Implement Parallel Processing:**
   - Batch multiple requests using Promise.all()
   - Use Web Workers for heavy computation
   - Implement request priority queue

### Managing Rate Limits

1. **Monitor Rate Limit Errors:**
   ```sql
   SELECT DATE_TRUNC('hour', accessed_at) as hour,
          COUNT(*) as rate_limit_errors
   FROM esi_service_request_logs
   WHERE status_code = 420
     AND accessed_at > NOW() - INTERVAL '7 days'
   GROUP BY hour
   ORDER BY hour DESC;
   ```

2. **Implement Request Throttling:**
   - Add delay between requests to same endpoint
   - Implement request queue with max concurrency
   - Use exponential backoff for retries

3. **Optimize Sync Frequency:**
   - Reduce MemberAudit auto-refresh intervals
   - Disable auto-refresh for inactive users
   - Batch updates during off-peak hours

## Cache Management

### Cache Cleanup

**Manual Cache Cleanup:**
```sql
-- Remove expired entries
DELETE FROM esi_service_cache WHERE expires_at < NOW();

-- Remove low-priority old entries
DELETE FROM esi_service_cache 
WHERE priority < 5 
  AND last_accessed < NOW() - INTERVAL '7 days';

-- Clear specific endpoint cache
DELETE FROM esi_service_cache 
WHERE endpoint LIKE '/characters/%/wallet/';
```

**Automated Cleanup (Cron):**
- Runs daily at 3 AM UTC
- Removes entries expired >24 hours ago
- Maintains cache size <10GB

### Cache Invalidation

**Invalidate by Tag:**
```typescript
// In CacheManager
await cacheManager.invalidateByTag('wallet', characterId);
await cacheManager.invalidateByTag('skills', characterId);
```

**Bulk Invalidation:**
```sql
-- Invalidate all character data
UPDATE esi_service_cache 
SET expires_at = NOW() 
WHERE character_id = YOUR_CHARACTER_ID;

-- Invalidate specific endpoint pattern
UPDATE esi_service_cache 
SET expires_at = NOW() 
WHERE endpoint LIKE '/characters/%/assets/';
```

### Cache Priority System

Priority levels (1-10):
- **10**: Critical realtime data (location, ship)
- **8**: High-frequency access (wallet balance, skills)
- **6**: Moderate frequency (assets, contacts)
- **4**: Low frequency (contracts, industry jobs)
- **2**: Rare access (universe names, type info)

**Adjust Priority:**
```sql
UPDATE esi_service_cache 
SET priority = 10 
WHERE endpoint LIKE '/characters/%/location/' 
  AND priority < 10;
```

## Token Management

### Token Refresh Monitoring

**Check Token Health:**
```sql
SELECT 
  COUNT(*) as total_tokens,
  SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) as valid_tokens,
  SUM(CASE WHEN expires_at BETWEEN NOW() AND NOW() + INTERVAL '1 hour' THEN 1 ELSE 0 END) as expiring_soon,
  SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired_tokens
FROM esi_service_tokens;
```

**Failed Token Refreshes:**
```sql
SELECT character_id, validation_failures, last_validated_at
FROM esi_service_tokens
WHERE validation_failures > 3
ORDER BY validation_failures DESC;
```

### Manual Token Refresh

**Refresh Single Character:**
```typescript
// Call edge function directly
const { data, error } = await supabase.functions.invoke('esi-token-refresh', {
  body: { characterId: YOUR_CHARACTER_ID }
});
```

**Bulk Token Refresh:**
```sql
-- Trigger refresh for all expiring tokens
SELECT character_id 
FROM esi_service_tokens 
WHERE expires_at < NOW() + INTERVAL '10 minutes';
```

### Token Scope Management

**Verify Required Scopes:**
```sql
SELECT character_id, scopes
FROM esi_service_tokens
WHERE NOT (scopes @> ARRAY[
  'esi-wallet.read_character_wallet.v1',
  'esi-skills.read_skills.v1',
  'esi-assets.read_assets.v1'
]);
```

## Database Maintenance

### Index Optimization

**Check Index Usage:**
```sql
SELECT schemaname, tablename, indexname, idx_scan as scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

**Create Missing Indexes:**
```sql
-- Add index if scan count is high but no index exists
CREATE INDEX CONCURRENTLY idx_esi_cache_character_endpoint 
ON esi_service_cache(character_id, endpoint);

CREATE INDEX CONCURRENTLY idx_request_logs_timestamp 
ON esi_service_request_logs(accessed_at DESC);
```

### Query Performance

**Identify Slow Queries:**
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Vacuum and Analyze:**
```sql
-- Full vacuum (during maintenance window)
VACUUM FULL ANALYZE esi_service_cache;
VACUUM FULL ANALYZE esi_service_request_logs;

-- Regular maintenance
ANALYZE esi_service_cache;
ANALYZE member_audit_metadata;
```

## Monitoring Alerts

### Setting Up Alerts

**Token Expiration Alert:**
- Trigger: >5 expired tokens in last hour
- Action: Check Cron job status, verify token refresh function

**High Error Rate Alert:**
- Trigger: Error rate >10% in last 30 minutes
- Action: Check ESI status, review error logs

**Cache Hit Rate Alert:**
- Trigger: Hit rate <70% for 1 hour
- Action: Review cache TTL, check cache size

**Slow Response Time Alert:**
- Trigger: Average response time >2s for 15 minutes
- Action: Check database load, verify cache efficiency

### Health Check Endpoints

**System Health:**
```typescript
GET /api/health
Response: {
  status: "healthy" | "degraded" | "down",
  checks: {
    database: "ok",
    esi: "ok",
    cache: "ok",
    tokens: "ok"
  }
}
```

## Backup and Recovery

### Database Backups

**Automated Backups:**
- Daily full backup at 2 AM UTC
- Retain for 30 days
- Stored in Supabase backup storage

**Manual Backup:**
```bash
# Export specific tables
pg_dump -h YOUR_HOST -U postgres -t esi_service_cache > cache_backup.sql
pg_dump -h YOUR_HOST -U postgres -t member_audit_metadata > metadata_backup.sql
```

### Disaster Recovery

**Cache Rebuild:**
1. Clear all cache: `DELETE FROM esi_service_cache;`
2. Trigger preload for all active users
3. Monitor cache hit rate recovery

**Token Recovery:**
1. Users must re-authenticate via EVE SSO
2. System automatically refreshes on login
3. Verify scope permissions are correct

## Security Considerations

### Access Control

- ESI Monitor Dashboard: Admin/Developer only
- Token data: RLS policies enforce user isolation
- API Keys: Stored encrypted in Supabase Vault

### Audit Logging

**Track Admin Actions:**
```sql
SELECT * FROM role_assignment_logs
WHERE action = 'grant'
  AND role_name = 'admin'
ORDER BY created_at DESC;
```

### Rate Limiting

- Implement per-user rate limits
- Monitor for abuse patterns
- Block suspicious IP addresses

## Common Maintenance Tasks

### Daily Tasks
- ✅ Review ESI Monitor Dashboard
- ✅ Check token refresh status
- ✅ Verify cache hit rate >85%
- ✅ Review error logs for anomalies

### Weekly Tasks
- ✅ Analyze slow queries
- ✅ Review cache efficiency by endpoint
- ✅ Check database size growth
- ✅ Verify backup completion

### Monthly Tasks
- ✅ Performance tuning based on trends
- ✅ Database vacuum and analyze
- ✅ Review and update documentation
- ✅ Security audit and updates
