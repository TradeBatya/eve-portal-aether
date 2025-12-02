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
 * Differentiated TTL configuration for various data types
 */
export const CACHE_TTL = {
  // Realtime data (30s)
  location: 30,
  ship: 30,
  online_status: 30,

  // Frequent updates (5 min)
  wallet_balance: 300,
  notifications: 300,
  skill_queue: 300,

  // Moderate updates (1 hour)
  skills: 3600,
  assets: 3600,
  contacts: 3600,
  wallet_journal: 3600,
  wallet_transactions: 3600,
  implants: 3600,
  clones: 3600,

  // Rare updates (24 hours)
  character_info: 86400,
  corporation_info: 86400,
  contracts: 86400,
  industry_jobs: 86400,
  loyalty_points: 86400,

  // Very rare updates (30 days)
  universe_names: 2592000,
  type_info: 2592000,
} as const;

/**
 * CacheManager - Multi-level caching system
 * Implements memory + database caching with intelligent invalidation
 */
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache = new Map<string, { data: any; expires: number; accessCount: number }>();
  private readonly MEMORY_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_MEMORY_ENTRIES = 1000;
  
  // Protection against multiple simultaneous preloads
  private preloadInProgress = new Set<number>();
  private preloadedCharacters = new Set<number>();
  
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
        .maybeSingle();

      if (error) {
        console.error(`[CacheManager] DB cache read error for key ${key}:`, error);
        return null;
      }

      if (!data) {
        console.log(`[CacheManager] Cache miss (DB) for key: ${key}`);
        return null;
      }

      // Update access count
      await supabase
        .from('esi_service_cache')
        .update({ 
          access_count: (data.access_count || 0) + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('cache_key', key);

      console.log(`[CacheManager] Cache hit (DB) for key: ${key}`);
      return data.data as T;

    } catch (error) {
      console.error('[CacheManager] DB cache exception:', error);
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
      const endpoint = key.split(':')[1] || 'unknown';
      const characterId = this.extractCharacterId(key);

      const { error } = await supabase
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

      if (error) {
        console.error(`[CacheManager] Failed to write cache for key ${key}:`, error);
      } else {
        console.log(`[CacheManager] Cache written (DB) for key: ${key}`);
      }

    } catch (error) {
      console.error('[CacheManager] DB cache write exception:', error);
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
   * Preload important data into cache with prioritized loading
   * Priority 1 (instant): basic, location, ship
   * Priority 2 (5s delay): wallet, skills
   * Priority 3 (10s delay): assets, contacts
   */
  async preload(characterId: number, modules: string[]): Promise<void> {
    // Prevent multiple preloads for the same character
    if (this.preloadInProgress.has(characterId)) {
      console.log(`[CacheManager] Preload already in progress for character ${characterId}, skipping`);
      return;
    }
    
    // Prevent re-preloading characters that were already preloaded in this session
    if (this.preloadedCharacters.has(characterId)) {
      console.log(`[CacheManager] Character ${characterId} already preloaded in this session, skipping`);
      return;
    }
    
    this.preloadInProgress.add(characterId);
    console.log(`[CacheManager] Starting preload for character ${characterId}...`, modules);
    
    const priority1 = modules.filter(m => ['basic', 'location', 'ship'].includes(m));
    const priority2 = modules.filter(m => ['wallet', 'skills', 'skill_queue'].includes(m));
    const priority3 = modules.filter(m => ['assets', 'contacts', 'implants'].includes(m));

    try {
      // Priority 1: Load immediately
      if (priority1.length > 0) {
        await Promise.allSettled(
          priority1.map(module => this.preloadModule(characterId, module))
        );
        console.log(`[CacheManager] Priority 1 loaded: ${priority1.join(', ')}`);
      }

      // Priority 2: Load after 2s
      if (priority2.length > 0) {
        setTimeout(async () => {
          await Promise.allSettled(
            priority2.map(module => this.preloadModule(characterId, module))
          );
          console.log(`[CacheManager] Priority 2 loaded: ${priority2.join(', ')}`);
        }, 2000);
      }

      // Priority 3: Load after 5s
      if (priority3.length > 0) {
        setTimeout(async () => {
          await Promise.allSettled(
            priority3.map(module => this.preloadModule(characterId, module))
          );
          console.log(`[CacheManager] Priority 3 loaded: ${priority3.join(', ')}`);
        }, 5000);
      }
      
      // Mark as preloaded
      this.preloadedCharacters.add(characterId);
    } catch (error) {
      console.error('[CacheManager] Preload error:', error);
    } finally {
      this.preloadInProgress.delete(characterId);
    }
  }

  /**
   * Preload a specific module for a character
   * Uses singleton Supabase client to avoid multiple GoTrueClient instances
   */
  private async preloadModule(characterId: number, module: string): Promise<void> {
    // Map modules to ESI endpoints
    const endpoints: Record<string, string> = {
      basic: `/characters/${characterId}/`,
      location: `/characters/${characterId}/location/`,
      ship: `/characters/${characterId}/ship/`,
      wallet: `/characters/${characterId}/wallet/`,
      skills: `/characters/${characterId}/skills/`,
      skill_queue: `/characters/${characterId}/skillqueue/`,
      assets: `/characters/${characterId}/assets/`,
      contacts: `/characters/${characterId}/contacts/`,
      implants: `/characters/${characterId}/implants/`
    };

    const endpoint = endpoints[module];
    if (!endpoint) return;

    // Use the same cache key format as esi-core-proxy
    const cacheKey = `${endpoint}:char:${characterId}`;
    
    // Check if already cached in memory first (quick check)
    const memoryCached = this.getFromMemory(cacheKey);
    if (memoryCached !== null) {
      console.log(`[CacheManager] ${module} already in memory cache for character ${characterId}`);
      return;
    }

    try {
      // Use singleton Supabase client - no new client creation!
      const { data, error } = await supabase.functions.invoke('esi-core-proxy', {
        body: { endpoint, method: 'GET', characterId }
      });

      if (error) {
        console.error(`[CacheManager] Preload failed for ${module}:`, error);
      } else {
        console.log(`✓ Preloaded ${module} for character ${characterId}`);
      }
    } catch (error) {
      console.error(`[CacheManager] Preload exception for ${module}:`, error);
    }
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
