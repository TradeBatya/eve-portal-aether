import { supabase } from '@/integrations/supabase/client';

/**
 * NameResolver - Bulk ID to name resolution
 * Analogue of Django-ESI providers.esi.EsiNameFetcher
 */
export class NameResolver {
  private static instance: NameResolver;
  private batchQueue = new Map<string, Promise<Map<number, string>>>();
  private readonly BATCH_SIZE = 1000; // ESI limit
  private readonly CACHE_TTL = 30 * 24 * 60 * 60; // 30 days

  private constructor() {}

  static getInstance(): NameResolver {
    if (!NameResolver.instance) {
      NameResolver.instance = new NameResolver();
    }
    return NameResolver.instance;
  }

  /**
   * Resolve multiple IDs to names with caching and batching
   */
  async getNames(ids: number[]): Promise<Map<number, string>> {
    if (!ids || ids.length === 0) return new Map();

    // Filter and deduplicate
    const uniqueIds = [...new Set(ids.filter(id => id && id > 0))];
    if (uniqueIds.length === 0) return new Map();

    // Check cache first
    const { cached, missing } = await this.checkCache(uniqueIds);
    
    if (missing.length === 0) {
      return cached;
    }

    // Resolve missing IDs
    const resolved = await this.resolveMissing(missing);
    
    // Merge cached and newly resolved
    resolved.forEach((value, key) => cached.set(key, value));
    
    return cached;
  }

  /**
   * Check which IDs are already cached
   */
  private async checkCache(ids: number[]): Promise<{ cached: Map<number, string>; missing: number[] }> {
    const cached = new Map<number, string>();
    const missing: number[] = [];

    try {
      const { data: cachedNames } = await supabase
        .from('esi_service_universe_names')
        .select('id, name')
        .in('id', ids)
        .gt('expires_at', new Date().toISOString());

      if (cachedNames) {
        cachedNames.forEach(item => {
          cached.set(item.id, item.name);
        });
      }

      // Find missing IDs
      ids.forEach(id => {
        if (!cached.has(id)) {
          missing.push(id);
        }
      });

    } catch (error) {
      console.error('Name cache check failed:', error);
      return { cached, missing: ids };
    }

    return { cached, missing };
  }

  /**
   * Resolve missing IDs from ESI
   */
  private async resolveMissing(ids: number[]): Promise<Map<number, string>> {
    const results = new Map<number, string>();

    // Split into batches of 1000
    const batches = this.createBatches(ids, this.BATCH_SIZE);

    for (const batch of batches) {
      const batchKey = batch.sort((a, b) => a - b).join(',');

      // Prevent duplicate requests
      if (!this.batchQueue.has(batchKey)) {
        const promise = this.executeBatch(batch);
        this.batchQueue.set(batchKey, promise);

        promise.finally(() => {
          this.batchQueue.delete(batchKey);
        });
      }

      const batchResults = await this.batchQueue.get(batchKey)!;
      batchResults.forEach((value, key) => results.set(key, value));
    }

    return results;
  }

  /**
   * Execute single batch resolution
   */
  private async executeBatch(ids: number[]): Promise<Map<number, string>> {
    const results = new Map<number, string>();

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/universe-resolver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ ids })
      });

      if (!response.ok) {
        throw new Error(`Universe resolver failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.names) {
        data.names.forEach((item: { id: number; name: string; category: string }) => {
          results.set(item.id, item.name);
        });

        // Cache results
        await this.cacheResults(data.names);
      }

    } catch (error) {
      console.error('Batch name resolution failed:', error);
      
      // Return fallback values
      ids.forEach(id => {
        results.set(id, `[${id}]`);
      });
    }

    return results;
  }

  /**
   * Cache resolved names
   */
  private async cacheResults(items: Array<{ id: number; name: string; category: string }>): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + this.CACHE_TTL * 1000).toISOString();
      
      const records = items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        expires_at: expiresAt
      }));

      await supabase
        .from('esi_service_universe_names')
        .upsert(records, { onConflict: 'id' });

    } catch (error) {
      console.error('Failed to cache resolved names:', error);
    }
  }

  /**
   * Create batches from array
   */
  private createBatches(ids: number[], batchSize: number): number[][] {
    const batches: number[][] = [];
    
    for (let i = 0; i < ids.length; i += batchSize) {
      batches.push(ids.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Get single name (convenience method)
   */
  async getName(id: number): Promise<string> {
    const names = await this.getNames([id]);
    return names.get(id) || `[${id}]`;
  }

  /**
   * Clear name cache
   */
  async clearCache(): Promise<void> {
    await supabase
      .from('esi_service_universe_names')
      .delete()
      .neq('id', 0);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ total: number; categories: Record<string, number> }> {
    const { data: stats } = await supabase
      .from('esi_service_universe_names')
      .select('category', { count: 'exact' });

    const categories: Record<string, number> = {};
    
    stats?.forEach((item: any) => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });

    return {
      total: stats?.length || 0,
      categories
    };
  }
}

export const nameResolver = NameResolver.getInstance();
