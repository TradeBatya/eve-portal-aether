import { supabase } from '@/integrations/supabase/client';

export interface CacheEntry {
  key: string;
  data: any;
  expiresAt: Date;
  tags?: string[];
  priority?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  memorySize: number;
  databaseSize: number;
}

/**
 * CacheManager - Multi-level caching system
 * Implements memory + database caching with intelligent invalidation
 */
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache = new Map<string, { data: any; expires: number; accessCount: number }>();
  private readonly MEMORY_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_MEMORY_ENTRIES = 1000;
  
  private stats = {
    hits: 0,
    misses: 0,
    memoryHits: 0,
    dbHits: 0
  };

  private constructor() {
    this.initializeCleanup();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get data from cache (memory -> database)
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryCached = this.getFromMemory<T>(key);
    if (memoryCached !== null) {
      this.stats.hits++;
      this.stats.memoryHits++;
      return memoryCached;
    }

    // Try database cache
    const dbCached = await this.getFromDatabase<T>(key);
    if (dbCached !== null) {
      this.stats.hits++;
      this.stats.dbHits++;
      
      // Promote to memory cache
      this.setInMemory(key, dbCached, Date.now() + this.MEMORY_TTL);
      
      return dbCached;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set data in cache
   */
  async set(key: string, data: any, ttl: number, options: { tags?: string[]; priority?: number } = {}): Promise<void> {
    const expiresAt = Date.now() + ttl * 1000;
    
    // Set in memory cache
    this.setInMemory(key, data, expiresAt);
    
    // Set in database cache
    await this.setInDatabase(key, data, expiresAt, options);
  }

  /**
   * Memory cache operations
   */
  private getFromMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() >= cached.expires) {
      this.memoryCache.delete(key);
      return null;
    }

    cached.accessCount++;
    return cached.data as T;
  }

  private setInMemory(key: string, data: any, expires: number): void {
    // Evict old entries if cache is full
    if (this.memoryCache.size >= this.MAX_MEMORY_ENTRIES) {
      this.evictLeastUsed();
    }

    this.memoryCache.set(key, {
      data,
      expires,
      accessCount: 0
    });
  }

  private evictLeastUsed(): void {
    let minAccessCount = Infinity;
    let leastUsedKey: string | null = null;

    this.memoryCache.forEach((value, key) => {
      if (value.accessCount < minAccessCount) {
        minAccessCount = value.accessCount;
        leastUsedKey = key;
      }
    });

    if (leastUsedKey) {
      this.memoryCache.delete(leastUsedKey);
    }
  }

  /**
   * Database cache operations
   */
  private async getFromDatabase<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('esi_service_cache')
        .select('data, expires_at, access_count')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      // Update access count
      await supabase
        .from('esi_service_cache')
        .update({ 
          access_count: (data.access_count || 0) + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('cache_key', key);

      return data.data as T;

    } catch (error) {
      console.error('Cache DB read error:', error);
      return null;
    }
  }

  private async setInDatabase(
    key: string, 
    data: any, 
    expiresAt: number, 
    options: { tags?: string[]; priority?: number }
  ): Promise<void> {
    try {
      const endpoint = key.split(':')[0] || 'unknown';
      const characterId = this.extractCharacterId(key);

      await supabase
        .from('esi_service_cache')
        .upsert({
          cache_key: key,
          endpoint,
          character_id: characterId,
          data,
          expires_at: new Date(expiresAt).toISOString(),
          tags: options.tags || [],
          priority: options.priority || 0,
          access_count: 0
        });

    } catch (error) {
      console.error('Cache DB write error:', error);
    }
  }

  private extractCharacterId(key: string): number | null {
    const match = key.match(/char:(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Invalidate cache by pattern or tags
   */
  async invalidate(pattern: string): Promise<number> {
    try {
      // Clear from memory
      let memoryCleared = 0;
      this.memoryCache.forEach((_, key) => {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
          memoryCleared++;
        }
      });

      // Clear from database
      const { data, error } = await supabase
        .from('esi_service_cache')
        .delete()
        .or(`cache_key.like.%${pattern}%,tags.cs.{${pattern}}`)
        .select('cache_key');

      if (error) throw error;

      const dbCleared = data?.length || 0;
      console.log(`Cache invalidated: ${memoryCleared} from memory, ${dbCleared} from database`);

      return memoryCleared + dbCleared;

    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache for specific character
   */
  async invalidateCharacter(characterId: number): Promise<number> {
    try {
      // Clear from memory
      let cleared = 0;
      const pattern = `char:${characterId}`;
      
      this.memoryCache.forEach((_, key) => {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
          cleared++;
        }
      });

      // Clear from database
      const { data } = await supabase
        .from('esi_service_cache')
        .delete()
        .eq('character_id', characterId)
        .select('cache_key');

      return cleared + (data?.length || 0);

    } catch (error) {
      console.error('Character cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Preload important data into cache
   */
  async preload(characterId: number, endpoints: string[]): Promise<void> {
    console.log(`Preloading cache for character ${characterId}...`);
    
    // This would trigger fetches that get cached
    // Implementation depends on ESI service integration
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const { data: dbStats } = await supabase
      .from('esi_service_cache')
      .select('cache_key', { count: 'exact', head: true });

    const hitRate = this.stats.hits + this.stats.misses > 0
      ? this.stats.hits / (this.stats.hits + this.stats.misses)
      : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalEntries: this.stats.hits + this.stats.misses,
      memorySize: this.memoryCache.size,
      databaseSize: dbStats?.length || 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      dbHits: 0
    };
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    
    await supabase
      .from('esi_service_cache')
      .delete()
      .neq('cache_key', ''); // Delete all
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<number> {
    // Cleanup memory
    let memoryCleared = 0;
    const now = Date.now();
    
    this.memoryCache.forEach((value, key) => {
      if (now >= value.expires) {
        this.memoryCache.delete(key);
        memoryCleared++;
      }
    });

    // Cleanup database
    try {
      const { data } = await supabase
        .from('esi_service_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('cache_key');

      return memoryCleared + (data?.length || 0);

    } catch (error) {
      console.error('Cache cleanup error:', error);
      return memoryCleared;
    }
  }

  /**
   * Initialize periodic cleanup
   */
  private initializeCleanup(): void {
    // Cleanup every 5 minutes
    setInterval(() => {
      this.cleanup().then(cleared => {
        if (cleared > 0) {
          console.log(`Cache cleanup: ${cleared} entries removed`);
        }
      });
    }, 5 * 60 * 1000);
  }
}

export const cacheManager = CacheManager.getInstance();
