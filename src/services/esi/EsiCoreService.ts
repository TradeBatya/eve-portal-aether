import { supabase } from '@/integrations/supabase/client';

export interface EsiRequestOptions {
  characterId?: number;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  useCache?: boolean;
  ttl?: number;
  retryCount?: number;
  priority?: 'high' | 'normal' | 'low';
}

export interface EsiResponse<T> {
  data: T;
  fromCache: boolean;
  expiresAt?: string;
  headers?: Record<string, string>;
}

export interface EsiError extends Error {
  statusCode?: number;
  endpoint?: string;
  originalError?: any;
  timestamp?: string;
}

class EsiCoreService {
  private static instance: EsiCoreService;
  private baseUrl = 'https://esi.evetech.net/latest';
  private userAgent = 'EVE Portal Aether v3.0 - contact@advent-coalition.com';
  
  // In-memory cache for fast access
  private memoryCache = new Map<string, { data: any; expires: number }>();
  private memoryCacheTtl = 2 * 60 * 1000; // 2 minutes

  // Queues for bulk operations
  private bulkNameQueue = new Map<string, Promise<Map<number, string>>>();
  private requestQueue = new Map<string, Promise<any>>();
  
  // Statistics and monitoring
  private requestStats = {
    total: 0,
    cached: 0,
    failed: 0,
    lastReset: Date.now()
  };

  private constructor() {
    this.initializeCleanupInterval();
  }

  static getInstance(): EsiCoreService {
    if (!EsiCoreService.instance) {
      EsiCoreService.instance = new EsiCoreService();
    }
    return EsiCoreService.instance;
  }

  /**
   * MAIN METHOD FOR ALL ESI REQUESTS
   * Used by all plugins
   */
  async request<T>(endpoint: string, options: EsiRequestOptions = {}): Promise<EsiResponse<T>> {
    this.requestStats.total++;
    
    const {
      characterId,
      method = 'GET',
      body,
      useCache = true,
      ttl,
      retryCount = 2
    } = options;

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(endpoint, method, body, characterId);

      // Check cache
      if (useCache && method === 'GET') {
        const cached = await this.getCachedData<T>(cacheKey);
        if (cached) {
          this.requestStats.cached++;
          return cached;
        }
      }

      // Execute request
      const response = await this.executeRequest<T>(endpoint, {
        characterId,
        method,
        body,
        retryCount
      });

      // Cache result
      if (useCache && response.data && method === 'GET') {
        const cacheTtl = ttl || this.getDefaultTtl(endpoint);
        await this.cacheData(cacheKey, endpoint, characterId, response.data, cacheTtl);
      }

      return {
        data: response.data,
        fromCache: false,
        headers: response.headers
      };

    } catch (error: any) {
      this.requestStats.failed++;
      throw this.enhanceError(error, endpoint, options);
    }
  }

  /**
   * BULK NAME RESOLUTION - used by all plugins
   */
  async resolveNames(ids: number[]): Promise<Map<number, string>> {
    if (!ids || ids.length === 0) return new Map();

    // Filter and deduplicate IDs
    const uniqueIds = [...new Set(ids.filter(id => id && id > 0))];
    if (uniqueIds.length === 0) return new Map();

    const batchKey = uniqueIds.sort((a, b) => a - b).join(',');

    // If request is already in progress - return existing Promise
    if (!this.bulkNameQueue.has(batchKey)) {
      const promise = this.executeBulkResolve(uniqueIds);
      this.bulkNameQueue.set(batchKey, promise);
      
      // Cleanup after completion
      promise.finally(() => {
        this.bulkNameQueue.delete(batchKey);
      });
    }

    return this.bulkNameQueue.get(batchKey)!;
  }

  /**
   * GET CHARACTER DATA - universal method for all plugins
   */
  async getCharacterData(characterId: number, dataTypes: string[] = ['all']): Promise<any> {
    const requests: Promise<any>[] = [];
    const requestedTypes = new Set(dataTypes);

    const results: Record<string, any> = {};

    // Basic data (always fetch)
    if (requestedTypes.has('all') || requestedTypes.has('basic')) {
      requests.push(
        this.request(`/characters/${characterId}/`, { characterId, ttl: 300 })
          .then(r => { results.basic = r.data; })
          .catch(e => { console.error('Failed to fetch basic data:', e); })
      );
    }

    // Dynamic request addition based on requested data types
    if (requestedTypes.has('all') || requestedTypes.has('location')) {
      requests.push(
        this.request(`/characters/${characterId}/location/`, { characterId, ttl: 30 })
          .then(r => { results.location = r.data; })
          .catch(e => { console.error('Failed to fetch location:', e); })
      );
    }

    if (requestedTypes.has('all') || requestedTypes.has('ship')) {
      requests.push(
        this.request(`/characters/${characterId}/ship/`, { characterId, ttl: 30 })
          .then(r => { results.ship = r.data; })
          .catch(e => { console.error('Failed to fetch ship:', e); })
      );
    }

    if (requestedTypes.has('all') || requestedTypes.has('skills')) {
      requests.push(
        this.request(`/characters/${characterId}/skills/`, { characterId, ttl: 300 })
          .then(r => { results.skills = r.data; })
          .catch(e => { console.error('Failed to fetch skills:', e); })
      );
    }

    if (requestedTypes.has('all') || requestedTypes.has('wallet')) {
      requests.push(
        this.request(`/characters/${characterId}/wallet/`, { characterId, ttl: 60 })
          .then(r => { results.wallet = r.data; })
          .catch(e => { console.error('Failed to fetch wallet:', e); })
      );
    }

    if (requestedTypes.has('all') || requestedTypes.has('assets')) {
      requests.push(
        this.request(`/characters/${characterId}/assets/`, { characterId, ttl: 3600 })
          .then(r => { results.assets = r.data; })
          .catch(e => { console.error('Failed to fetch assets:', e); })
      );
    }

    if (requestedTypes.has('all') || requestedTypes.has('clones')) {
      requests.push(
        this.request(`/characters/${characterId}/clones/`, { characterId, ttl: 3600 })
          .then(r => { results.clones = r.data; })
          .catch(e => { console.error('Failed to fetch clones:', e); })
      );
    }

    // Execute all requests in parallel
    await Promise.allSettled(requests);
    
    // Collect IDs for name resolution
    const idsToResolve = new Set<number>();
    this.collectIdsForResolution(results, idsToResolve);

    // Bulk resolve all collected IDs
    if (idsToResolve.size > 0) {
      const resolvedNames = await this.resolveNames(Array.from(idsToResolve));
      this.applyResolvedNames(results, resolvedNames);
    }

    return results;
  }

  // Private implementation methods
  private async executeBulkResolve(ids: number[]): Promise<Map<number, string>> {
    const resultMap = new Map<number, string>();
    const missingIds: number[] = [];

    // Validate and filter IDs
    const validIds = ids.filter(id => {
      if (!id || id <= 0 || !Number.isInteger(id)) {
        console.warn(`Invalid ID filtered out: ${id}`);
        return false;
      }
      return true;
    });

    if (validIds.length === 0) {
      return resultMap;
    }

    // Check cache for each ID
    for (const id of validIds) {
      const cachedName = await this.getCachedName(id);
      if (cachedName) {
        resultMap.set(id, cachedName);
      } else {
        missingIds.push(id);
      }
    }

    // Request missing IDs from ESI (batch in chunks of 1000)
    if (missingIds.length > 0) {
      const BATCH_SIZE = 1000;
      const batches = [];
      
      for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
        batches.push(missingIds.slice(i, i + BATCH_SIZE));
      }

      for (const batch of batches) {
        try {
          const response = await this.request<Array<{id: number; name: string; category: string}>>(
            '/universe/names/', 
            {
              method: 'POST',
              body: batch,
              useCache: true,
              ttl: 30 * 24 * 60 * 60 // 30 days
            }
          );

          // Cache results
          if (Array.isArray(response.data)) {
            for (const item of response.data) {
              if (item && item.id && item.name) {
                resultMap.set(item.id, item.name);
                await this.cacheName(item.id, item.name, item.category || 'unknown');
              }
            }
          }
        } catch (error: any) {
          console.error(`Bulk resolve failed for batch: ${error.message}`);
          // Continue with next batch
        }
      }
    }

    return resultMap;
  }

  private async executeRequest<T>(
    endpoint: string, 
    options: { characterId?: number; method: string; body?: any; retryCount: number }
  ): Promise<{ data: T; headers: Record<string, string> }> {
    
    // Use Edge Function to execute request
    const { data, error } = await supabase.functions.invoke('esi-core-proxy', {
      body: {
        endpoint,
        characterId: options.characterId,
        method: options.method,
        body: options.body,
        userAgent: this.userAgent
      }
    });

    if (error) throw error;
    return data;
  }

  private generateCacheKey(endpoint: string, method: string, body: any, characterId?: number): string {
    const parts = [
      'v3',
      method,
      endpoint.replace(/\//g, '_'),
      characterId || 'public',
      body ? btoa(JSON.stringify(body)) : 'no-body'
    ];
    return parts.join('|');
  }

  private async getCachedData<T>(cacheKey: string): Promise<EsiResponse<T> | null> {
    // Check memory cache
    const memoryCached = this.memoryCache.get(cacheKey);
    if (memoryCached && Date.now() < memoryCached.expires) {
      return { data: memoryCached.data, fromCache: true };
    }

    // Check database cache
    const { data } = await supabase
      .from('esi_service_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (data) {
      // Update last accessed time
      supabase
        .from('esi_service_cache')
        .update({ last_accessed: new Date().toISOString() })
        .eq('cache_key', cacheKey)
        .then(() => {});

      // Save to memory cache
      this.memoryCache.set(cacheKey, {
        data: data.data,
        expires: Date.now() + this.memoryCacheTtl
      });

      return { 
        data: data.data as T, 
        fromCache: true,
        expiresAt: data.expires_at
      };
    }

    return null;
  }

  private async cacheData(
    cacheKey: string, 
    endpoint: string, 
    characterId: number | undefined, 
    data: any, 
    ttl: number
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttl * 1000);

    // Save to memory cache
    this.memoryCache.set(cacheKey, {
      data,
      expires: Date.now() + Math.min(ttl * 1000, this.memoryCacheTtl)
    });

    // Save to database cache
    await supabase
      .from('esi_service_cache')
      .upsert({
        cache_key: cacheKey,
        endpoint,
        character_id: characterId,
        data,
        expires_at: expiresAt.toISOString(),
        last_accessed: new Date().toISOString()
      }, { onConflict: 'cache_key' });
  }

  private getDefaultTtl(endpoint: string): number {
    const ttlConfig: Record<string, number> = {
      location: 30,
      ship: 30,
      wallet: 60,
      skills: 300,
      assets: 3600,
      clones: 3600,
      contacts: 1800,
      names: 2592000, // 30 days
      types: 604800, // 7 days
      structures: 86400, // 24 hours
      stations: 2592000, // 30 days
      prices: 3600,
      orders: 300,
      corporation: 3600,
      members: 1800
    };

    // Match endpoint to TTL config
    for (const [key, ttl] of Object.entries(ttlConfig)) {
      if (endpoint.includes(key)) {
        return ttl;
      }
    }

    return 300; // Default 5 minutes
  }

  private initializeCleanupInterval(): void {
    // Cleanup expired memory cache every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.memoryCache.entries()) {
        if (now >= value.expires) {
          this.memoryCache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  private enhanceError(error: any, endpoint: string, options: EsiRequestOptions): EsiError {
    const enhancedError = new Error(`ESI Request Failed: ${endpoint} - ${error.message}`) as EsiError;
    enhancedError.originalError = error;
    enhancedError.endpoint = endpoint;
    enhancedError.statusCode = error.statusCode;
    enhancedError.timestamp = new Date().toISOString();
    
    return enhancedError;
  }

  private async getCachedName(id: number): Promise<string | null> {
    const { data } = await supabase
      .from('esi_service_universe_names')
      .select('name')
      .eq('id', id)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    return data?.name || null;
  }

  private async cacheName(id: number, name: string, category: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await supabase
      .from('esi_service_universe_names')
      .upsert({
        id,
        name,
        category,
        expires_at: expiresAt.toISOString()
      }, { onConflict: 'id' });
  }

  private collectIdsForResolution(data: any, idsSet: Set<number>): void {
    if (Array.isArray(data)) {
      data.forEach(item => this.collectIdsForResolution(item, idsSet));
    } else if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (key.endsWith('_id') && typeof value === 'number' && value > 0) {
          idsSet.add(value);
        } else if (value && typeof value === 'object') {
          this.collectIdsForResolution(value, idsSet);
        }
      }
    }
  }

  private applyResolvedNames(data: any, resolvedNames: Map<number, string>): void {
    if (Array.isArray(data)) {
      data.forEach(item => this.applyResolvedNames(item, resolvedNames));
    } else if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (key.endsWith('_id') && typeof value === 'number') {
          const nameKey = key.replace('_id', '_name');
          const resolvedName = resolvedNames.get(value);
          if (resolvedName) {
            data[nameKey] = resolvedName;
          }
        } else if (value && typeof value === 'object') {
          this.applyResolvedNames(value, resolvedNames);
        }
      }
    }
  }

  // Public methods for monitoring and management
  public getStats() {
    return {
      ...this.requestStats,
      memoryCacheSize: this.memoryCache.size,
      bulkQueueSize: this.bulkNameQueue.size,
      requestQueueSize: this.requestQueue.size,
      cacheHitRate: this.requestStats.total > 0 
        ? ((this.requestStats.cached / this.requestStats.total) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  public clearCache(scope: 'memory' | 'database' | 'all' = 'memory'): void {
    if (scope === 'memory' || scope === 'all') {
      this.memoryCache.clear();
    }
    
    if (scope === 'database' || scope === 'all') {
      supabase.rpc('cleanup_esi_cache').then(() => {
        console.log('Database cache cleaned');
      });
    }
  }
}

export const esiService = EsiCoreService.getInstance();
export default EsiCoreService;
