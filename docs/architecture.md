# EVE Portal Aether - Architecture Documentation

## Overview

EVE Portal Aether is a modern web application built for EVE Online corporations, providing comprehensive member management, fleet operations coordination, and ESI (EVE Swagger Interface) integration.

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

### Backend (Lovable Cloud)
- **Supabase** - PostgreSQL database, authentication, storage
- **Edge Functions** - Serverless backend logic
- **Row Level Security (RLS)** - Data access control

## Core Architecture

### ESI Core Framework

The ESI Core is the heart of the application, providing centralized management of EVE Online API integration.

```
┌─────────────────────────────────────────────┐
│           ESI Core Services                  │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ TokenManager │  │ CacheManager │        │
│  │  - Refresh   │  │  - Memory    │        │
│  │  - Validate  │  │  - Database  │        │
│  │  - Scopes    │  │  - Stats     │        │
│  └──────────────┘  └──────────────┘        │
│                                              │
│  ┌──────────────┐  ┌──────────────┐        │
│  │NameResolver  │  │  EsiMonitor  │        │
│  │  - Batch     │  │  - Metrics   │        │
│  │  - Cache     │  │  - Health    │        │
│  └──────────────┘  └──────────────┘        │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  TokenRefreshScheduler                 │ │
│  │  - Background refresh every 5 min      │ │
│  │  - Automatic token renewal             │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│              ESI Adapters                    │
├─────────────────────────────────────────────┤
│  BaseAdapter                                 │
│  ├─ WalletAdapter                           │
│  ├─ SkillsAdapter                           │
│  ├─ AssetsAdapter                           │
│  └─ MemberAuditAdapter                      │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│            React Hooks Layer                 │
├─────────────────────────────────────────────┤
│  useWallet    useSkills    useAssets        │
│  useMemberAudit                              │
└─────────────────────────────────────────────┘
```

### Data Flow

1. **User Authentication** → EVE SSO → Supabase Auth
2. **Token Storage** → `esi_service_tokens` + `eve_characters` tables
3. **Data Request** → React Hook → Adapter → ESI Core → Cache/API
4. **Token Refresh** → Background Scheduler → TokenManager → Database Update

### Caching Strategy

**Multi-level caching for optimal performance:**

1. **Memory Cache** (in-browser)
   - TTL: 5 minutes
   - Max entries: 1000
   - LRU eviction

2. **Database Cache** (`esi_service_cache`)
   - TTL: Varies by endpoint (5-60 minutes)
   - Priority-based eviction
   - Tag-based invalidation

3. **Cache Key Structure**
   ```
   {characterId}:{endpoint}:{params_hash}
   ```

### Token Management

**Automatic token refresh workflow:**

1. TokenRefreshScheduler checks tokens every 5 minutes
2. Tokens expiring within 10 minutes are refreshed
3. Failed refreshes increment `validation_failures`
4. After 3 failures, `auto_refresh_enabled` is disabled
5. Tokens sync between `esi_service_tokens` and `eve_characters`

### Database Schema

**Key Tables:**

- `esi_service_tokens` - ESI access tokens and refresh tokens
- `esi_service_cache` - Cached ESI responses
- `esi_service_request_logs` - API request metrics
- `esi_service_universe_names` - Entity name resolution cache
- `member_audit_*` - Character audit data (skills, wallet, assets, etc.)
- `eve_characters` - Linked EVE characters
- `profiles` - User profiles and settings

### Plugin System

**Modular plugin architecture:**

Each plugin is self-contained and registers with the PluginManager:

```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  component: React.ComponentType;
  requiredScopes?: string[];
}
```

**Core Plugins:**
- Character Overview
- Wallet Tracker
- Skill Monitor
- Asset Manager
- Member Audit

### Security

**Multi-layered security approach:**

1. **Row Level Security (RLS)** on all Supabase tables
2. **Token encryption** in database
3. **Scope validation** before API calls
4. **Rate limiting** on Edge Functions
5. **CORS** properly configured

### Monitoring

**ESI Monitor Dashboard provides:**

- Request success/failure rates
- Cache hit rates (memory + database)
- Token health status
- Endpoint performance metrics
- Recent errors and debugging info

## Development Workflow

### Adding a New ESI Feature

1. **Create Adapter** extending `BaseAdapter`
2. **Create React Hook** using the adapter
3. **Create UI Component** using the hook
4. **Register Plugin** (if applicable)
5. **Add Tests** for adapter and hook

### Database Migrations

All database changes go through Supabase migrations:

```bash
# Migrations are auto-applied via Lovable Cloud
```

### Edge Functions

Edge functions are automatically deployed:

1. Create function in `supabase/functions/{name}/index.ts`
2. Functions deploy on code commit
3. Access via `supabase.functions.invoke()`

## Performance Considerations

- **Cache First:** Always check cache before making ESI requests
- **Batch Requests:** Use NameResolver for bulk entity resolution
- **Lazy Loading:** Load data only when needed
- **Pagination:** Implement pagination for large datasets
- **Debouncing:** Debounce user inputs that trigger API calls

## Scalability

The architecture is designed to scale:

- **Stateless Edge Functions** - Horizontal scaling
- **Database Connection Pooling** - Handled by Supabase
- **CDN Caching** - Static assets served via CDN
- **Background Jobs** - Token refresh runs in background

## Error Handling

**Graceful degradation strategy:**

1. Try cache first
2. On cache miss, try ESI API
3. On API error, show stale cache data
4. Log all errors for monitoring
5. Display user-friendly error messages

## Deployment

- **Frontend:** Auto-deployed via Lovable
- **Backend:** Edge Functions auto-deploy
- **Database:** Migrations auto-apply
- **Monitoring:** ESI Monitor tracks health

## Future Enhancements

- [ ] GraphQL layer for optimized queries
- [ ] WebSocket support for real-time updates
- [ ] Advanced analytics dashboard
- [ ] Multi-corporation support
- [ ] Mobile app (React Native)
