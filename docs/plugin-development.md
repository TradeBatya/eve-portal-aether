# Plugin Development Guide

## Overview

EVE Portal Aether uses a modular plugin system that allows developers to extend functionality easily. Each plugin is self-contained and interacts with the ESI Core through standardized adapters and hooks.

## Plugin Structure

### Basic Plugin Anatomy

```typescript
// src/plugins/MyPlugin.tsx
import { Plugin } from '@/types/plugin';
import MyPluginComponent from '@/components/plugins/MyPlugin';

export const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'Description of what my plugin does',
  component: MyPluginComponent,
  requiredScopes: [
    'esi-wallet.read_character_wallet.v1'
  ],
  icon: 'wallet', // lucide-react icon name
  category: 'character' // or 'fleet', 'intel', 'management'
};
```

### Plugin Component

```typescript
// src/components/plugins/MyPlugin.tsx
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';

export default function MyPlugin() {
  const { user } = useAuth();
  const { balance, loading, error } = useWallet(user?.mainCharacterId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Card>
      <h2>Wallet Balance</h2>
      <p>{balance?.toLocaleString()} ISK</p>
    </Card>
  );
}
```

## Creating a New Plugin

### Step 1: Plan Your Plugin

Determine:
1. **What data does it need?** (Skills, Wallet, Assets, etc.)
2. **What ESI scopes are required?**
3. **How will it be displayed?** (Card, Full page, Widget)
4. **Who can use it?** (All users, Admins only)

### Step 2: Create the Adapter (if needed)

If you need data not covered by existing adapters:

```typescript
// src/services/esi/adapters/MyDataAdapter.ts
import { BaseAdapter } from './BaseAdapter';

interface MyData {
  id: number;
  name: string;
  value: number;
}

class MyDataAdapter extends BaseAdapter {
  async getData(characterId: number): Promise<MyData[]> {
    return this.fetchWithCache<MyData[]>(
      `/characters/${characterId}/my-endpoint/`,
      characterId,
      'my-data',
      300 // 5 minute TTL
    );
  }
}

export const myDataAdapter = new MyDataAdapter();
```

### Step 3: Create the Hook

```typescript
// src/hooks/useMyData.ts
import { useState, useEffect, useCallback } from 'react';
import { myDataAdapter, MyData } from '@/services/esi/adapters/MyDataAdapter';

interface UseMyDataOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useMyData(
  characterId: number | undefined,
  options: UseMyDataOptions = {}
) {
  const { enabled = true, autoRefresh = false, refreshInterval = 300000 } = options;
  
  const [data, setData] = useState<MyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!characterId || !enabled) return;
    
    try {
      setLoading(true);
      const result = await myDataAdapter.getData(characterId);
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [characterId, enabled]);

  useEffect(() => {
    if (enabled && characterId) {
      fetchData();
    }
  }, [characterId, enabled, fetchData]);

  useEffect(() => {
    if (autoRefresh && enabled && characterId) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, enabled, characterId, refreshInterval, fetchData]);

  return { data, loading, error, refresh: fetchData };
}
```

### Step 4: Build the Component

```typescript
// src/components/plugins/MyPlugin.tsx
import { useMyData } from '@/hooks/useMyData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function MyPlugin() {
  const { user } = useAuth();
  const mainCharacter = user?.eveCharacters?.find(c => c.is_main);
  
  const { data, loading, error, refresh } = useMyData(
    mainCharacter?.character_id,
    { autoRefresh: true, refreshInterval: 60000 }
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-destructive">{error}</p>
          <Button onClick={refresh} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>My Data</CardTitle>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul>
          {data.map(item => (
            <li key={item.id}>
              {item.name}: {item.value}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

### Step 5: Register the Plugin

```typescript
// src/plugins/index.ts
import { myPlugin } from './MyPlugin';

export const availablePlugins = [
  // ... existing plugins
  myPlugin,
];
```

## Best Practices

### 1. Use ESI Core Services

**Always use ESI Core services instead of direct fetch:**

```typescript
// ❌ DON'T
const response = await fetch('https://esi.evetech.net/...');

// ✅ DO
const data = await myAdapter.getData(characterId);
```

### 2. Handle Loading States

Provide clear loading indicators:

```typescript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;
```

### 3. Implement Refresh

Allow users to manually refresh data:

```typescript
<Button onClick={refresh}>
  <RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
</Button>
```

### 4. Cache Appropriately

Choose appropriate TTL based on data volatility:

- **Wallet Balance:** 5 minutes (300s)
- **Skills:** 15 minutes (900s)
- **Assets:** 30 minutes (1800s)
- **Character Info:** 1 hour (3600s)

### 5. Use TypeScript

Always define proper types:

```typescript
interface MyPluginData {
  id: number;
  name: string;
  timestamp: string;
}
```

### 6. Error Handling

Provide user-friendly error messages:

```typescript
try {
  const data = await adapter.getData(characterId);
} catch (error: any) {
  if (error.statusCode === 403) {
    setError('Missing required ESI scopes');
  } else if (error.statusCode === 404) {
    setError('Character data not found');
  } else {
    setError('Failed to load data. Please try again.');
  }
}
```

### 7. Responsive Design

Ensure your plugin works on all screen sizes:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Your content */}
</div>
```

## Testing Your Plugin

### 1. Unit Tests

```typescript
// MyPlugin.test.tsx
import { render, screen } from '@testing-library/react';
import MyPlugin from './MyPlugin';

test('renders plugin correctly', () => {
  render(<MyPlugin />);
  expect(screen.getByText('My Data')).toBeInTheDocument();
});
```

### 2. Manual Testing

1. Check loading state
2. Verify data displays correctly
3. Test refresh functionality
4. Test error scenarios (invalid token, missing scopes)
5. Check responsive design on different screen sizes

## Common Patterns

### Pagination

```typescript
const [page, setPage] = useState(1);
const [pageSize] = useState(50);

const { data } = useMyData(characterId, {
  page,
  pageSize
});
```

### Filtering

```typescript
const [filter, setFilter] = useState('');

const filteredData = data.filter(item =>
  item.name.toLowerCase().includes(filter.toLowerCase())
);
```

### Sorting

```typescript
const [sortBy, setSortBy] = useState<'name' | 'value'>('name');
const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

const sortedData = [...data].sort((a, b) => {
  const aVal = a[sortBy];
  const bVal = b[sortBy];
  return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
});
```

## Publishing Your Plugin

1. Document required scopes
2. Add screenshots
3. Write usage instructions
4. Submit PR to main repository
5. Update changelog

## Example Plugins

Check these example plugins for reference:

- `CharacterOverview` - Simple data display
- `WalletTracker` - Complex data with charts
- `SkillMonitor` - Real-time updates
- `AssetManager` - Pagination and filtering
- `MemberAudit` - Multi-tab layout

## Getting Help

- Check the [Architecture Documentation](./architecture.md)
- Review the [API Reference](./api-reference.md)
- Ask in Discord: [EVE Portal Aether Community](#)
- Submit issues on GitHub
