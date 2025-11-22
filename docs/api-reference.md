# ESI Core - API Reference

## TokenManager

Centralized token management with automatic refresh and validation.

### Methods

#### `getValidToken(characterId: number): Promise<string>`

Retrieves a valid access token for a character, automatically refreshing if needed.

```typescript
import { tokenManager } from '@/services/esi/TokenManager';

const token = await tokenManager.getValidToken(characterId);
```

**Returns:** Valid access token string

**Throws:** Error if character not found or token refresh fails

#### `refreshToken(characterId: number, refreshToken: string): Promise<void>`

Manually refreshes a token for a character.

```typescript
await tokenManager.refreshToken(characterId, refreshToken);
```

#### `validateScopes(characterId: number, requiredScopes: string[]): Promise<boolean>`

Checks if a character's token has the required scopes.

```typescript
const hasScopes = await tokenManager.validateScopes(characterId, [
  'esi-wallet.read_character_wallet.v1',
  'esi-skills.read_skills.v1'
]);
```

#### `getExpiredTokens(): Promise<number[]>`

Returns character IDs with tokens expiring soon.

```typescript
const expiredTokens = await tokenManager.getExpiredTokens();
```

#### `getTokenStats(): Promise<TokenStats>`

Returns statistics about the token pool.

```typescript
const stats = await tokenManager.getTokenStats();
// {
//   total: 150,
//   valid: 145,
//   expiring: 3,
//   expired: 2,
//   disabled: 0
// }
```

---

## CacheManager

Multi-level caching with memory and database layers.

### Methods

#### `get<T>(cacheKey: string): Promise<T | null>`

Retrieves data from cache (memory first, then database).

```typescript
import { cacheManager } from '@/services/esi/CacheManager';

const data = await cacheManager.get<WalletData>('123456:wallet:balance');
```

#### `set<T>(cacheKey: string, data: T, ttl: number, options?: CacheOptions): Promise<void>`

Stores data in cache with specified TTL.

```typescript
await cacheManager.set(
  '123456:wallet:balance',
  { balance: 1000000 },
  300, // 5 minutes
  {
    characterId: 123456,
    tags: ['wallet', 'balance'],
    priority: 5
  }
);
```

**Options:**
- `characterId?: number` - Associate with character
- `tags?: string[]` - Tags for bulk invalidation
- `priority?: number` - 0-10, higher = kept longer

#### `invalidate(pattern: string): Promise<void>`

Invalidates cache entries matching a pattern.

```typescript
// Invalidate all wallet data
await cacheManager.invalidate('*:wallet:*');

// Invalidate specific character
await cacheManager.invalidate('123456:*');
```

#### `invalidateCharacter(characterId: number): Promise<void>`

Invalidates all cache for a character.

```typescript
await cacheManager.invalidateCharacter(123456);
```

#### `getStats(): Promise<CacheStats>`

Returns cache statistics.

```typescript
const stats = await cacheManager.getStats();
// {
//   memoryCache: { size: 500, hits: 15000, misses: 2000 },
//   databaseCache: { size: 5000, hits: 8000, misses: 1000 },
//   hitRate: 0.92
// }
```

---

## NameResolver

Efficient entity ID to name resolution with batching and caching.

### Methods

#### `getNames(ids: number[]): Promise<Map<number, string>>`

Resolves multiple entity IDs to names in a single call.

```typescript
import { nameResolver } from '@/services/esi/NameResolver';

const names = await nameResolver.getNames([98012345, 98023456, 98034567]);
// Map {
//   98012345 => "Jita IV - Moon 4",
//   98023456 => "Amarr VIII",
//   98034567 => "Dodixie IX - Moon 20"
// }
```

#### `getName(id: number): Promise<string>`

Resolves a single entity ID to a name.

```typescript
const name = await nameResolver.getName(98012345);
// "Jita IV - Moon 4"
```

#### `clearCache(): Promise<void>`

Clears the name resolution cache.

```typescript
await nameResolver.clearCache();
```

---

## EsiMonitor

Monitoring and metrics for ESI service health.

### Methods

#### `getMetrics(): Promise<EsiMetrics>`

Returns current ESI service metrics.

```typescript
import { esiMonitor } from '@/services/esi/EsiMonitor';

const metrics = await esiMonitor.getMetrics();
// {
//   totalRequests: 50000,
//   successfulRequests: 48500,
//   failedRequests: 1500,
//   cacheHitRate: 0.85,
//   averageResponseTime: 250
// }
```

#### `getTokenHealth(): Promise<TokenHealth[]>`

Returns health status of all tokens.

```typescript
const health = await esiMonitor.getTokenHealth();
// [
//   {
//     characterId: 123456,
//     expiresAt: "2025-01-01T12:00:00Z",
//     isExpired: false,
//     expiresInMinutes: 45,
//     validationFailures: 0
//   }
// ]
```

#### `getEndpointStats(limit?: number): Promise<EndpointStats[]>`

Returns statistics for ESI endpoints.

```typescript
const stats = await esiMonitor.getEndpointStats(10);
// Top 10 most-used endpoints with success rates and avg response times
```

#### `getRecentErrors(limit?: number): Promise<ErrorLog[]>`

Returns recent error logs.

```typescript
const errors = await esiMonitor.getRecentErrors(20);
```

---

## Adapters

### WalletAdapter

#### `getBalance(characterId: number): Promise<number>`

```typescript
import { walletAdapter } from '@/services/esi/adapters/WalletAdapter';

const balance = await walletAdapter.getBalance(123456);
```

#### `getJournal(characterId: number, options?: JournalOptions): Promise<WalletJournalEntry[]>`

```typescript
const journal = await walletAdapter.getJournal(123456, {
  limit: 100,
  fromDate: '2025-01-01'
});
```

#### `getTransactions(characterId: number, options?: TransactionOptions): Promise<WalletTransaction[]>`

```typescript
const transactions = await walletAdapter.getTransactions(123456, {
  limit: 50
});
```

#### `getSummary(characterId: number): Promise<WalletSummary>`

```typescript
const summary = await walletAdapter.getSummary(123456);
// {
//   balance: 1000000000,
//   totalIncome: 500000000,
//   totalExpenses: 300000000,
//   netIncome: 200000000
// }
```

### SkillsAdapter

#### `getSkills(characterId: number): Promise<Skill[]>`

```typescript
import { skillsAdapter } from '@/services/esi/adapters/SkillsAdapter';

const skills = await skillsAdapter.getSkills(123456);
```

#### `getSkillQueue(characterId: number): Promise<SkillQueueItem[]>`

```typescript
const queue = await skillsAdapter.getSkillQueue(123456);
```

#### `getCompleteData(characterId: number): Promise<CompleteSkillData>`

```typescript
const data = await skillsAdapter.getCompleteData(123456);
// {
//   skills: [...],
//   queue: [...],
//   totalSp: 50000000,
//   unallocatedSp: 100000
// }
```

### AssetsAdapter

#### `getAssets(characterId: number): Promise<Asset[]>`

```typescript
import { assetsAdapter } from '@/services/esi/adapters/AssetsAdapter';

const assets = await assetsAdapter.getAssets(123456);
```

#### `getAssetsByLocation(characterId: number, locationId: number): Promise<Asset[]>`

```typescript
const assets = await assetsAdapter.getAssetsByLocation(123456, 60003760);
```

#### `searchAssets(characterId: number, query: string): Promise<Asset[]>`

```typescript
const assets = await assetsAdapter.searchAssets(123456, 'Tritanium');
```

#### `getSummary(characterId: number): Promise<AssetSummary>`

```typescript
const summary = await assetsAdapter.getSummary(123456);
// {
//   totalValue: 5000000000,
//   totalItems: 1500,
//   locationCount: 25,
//   topLocations: [...]
// }
```

---

## React Hooks

### useWallet

```typescript
import { useWallet } from '@/hooks/useWallet';

function WalletComponent() {
  const {
    balance,
    journal,
    transactions,
    summary,
    loading,
    error,
    refresh
  } = useWallet(characterId);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return <WalletDisplay balance={balance} />;
}
```

### useSkills

```typescript
import { useSkills } from '@/hooks/useSkills';

function SkillsComponent() {
  const {
    skills,
    skillQueue,
    completeData,
    loading,
    error,
    refresh
  } = useSkills(characterId);

  return <SkillTree skills={skills} />;
}
```

### useAssets

```typescript
import { useAssets } from '@/hooks/useAssets';

function AssetsComponent() {
  const {
    assets,
    summary,
    loading,
    error,
    getAssetsByLocation,
    searchAssets,
    refresh
  } = useAssets(characterId);

  return <AssetList assets={assets} />;
}
```

---

## Edge Functions

### esi-core-proxy

Proxy for ESI requests with automatic token management and caching.

**Endpoint:** `/functions/v1/esi-core-proxy`

**Request:**
```typescript
const { data, error } = await supabase.functions.invoke('esi-core-proxy', {
  body: {
    endpoint: '/characters/123456/wallet/',
    characterId: 123456,
    method: 'GET'
  }
});
```

### esi-token-refresh

Background token refresh service.

**Endpoint:** `/functions/v1/esi-token-refresh`

**Trigger:** Supabase Cron (every 5 minutes)

### update-member-audit

Full character data synchronization.

**Endpoint:** `/functions/v1/update-member-audit`

**Request:**
```typescript
const { data, error } = await supabase.functions.invoke('update-member-audit', {
  body: {
    character_id: 123456,
    modules: ['skills', 'wallet', 'assets']
  }
});
```
