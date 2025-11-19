import EsiCoreService from '../EsiCoreService';
import { tokenManager } from '../TokenManager';
import { cacheManager } from '../CacheManager';
import { nameResolver } from '../NameResolver';

/**
 * BaseAdapter - Foundation for all ESI adapters
 * Provides common functionality for ESI data access
 */
export abstract class BaseAdapter {
  protected esiService = EsiCoreService.getInstance();
  protected tokenManager = tokenManager;
  protected cacheManager = cacheManager;
  protected nameResolver = nameResolver;

  /**
   * Fetch with automatic retry and error handling
   */
  protected async fetchWithRetry<T>(
    endpoint: string,
    characterId: number,
    options: {
      ttl?: number;
      retryCount?: number;
      useCache?: boolean;
    } = {}
  ): Promise<T> {
    const {
      ttl = 3600,
      retryCount = 2,
      useCache = true
    } = options;

    try {
      const response = await this.esiService.request<T>(endpoint, {
        characterId,
        ttl,
        retryCount,
        useCache
      });

      return response.data;

    } catch (error: any) {
      console.error(`Fetch failed for ${endpoint}:`, error);
      throw new Error(`ESI request failed: ${error.message}`);
    }
  }

  /**
   * Validate token before making requests
   */
  protected async validateToken(characterId: number, scopes: string[]): Promise<void> {
    try {
      await this.tokenManager.getValidToken(characterId);

      if (scopes.length > 0) {
        const hasScopes = await this.tokenManager.validateScopes(characterId, scopes);
        if (!hasScopes) {
          throw new Error(`Missing required scopes: ${scopes.join(', ')}`);
        }
      }
    } catch (error: any) {
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Resolve IDs to names in data structure
   */
  protected async resolveIds(data: any, fields: string[]): Promise<void> {
    if (!data) return;

    // Collect all IDs to resolve
    const ids = new Set<number>();

    const extractIds = (obj: any, field: string) => {
      const parts = field.split('.');
      let current = obj;

      for (const part of parts) {
        if (current && typeof current === 'object') {
          current = current[part];
        } else {
          return;
        }
      }

      if (typeof current === 'number' && current > 0) {
        ids.add(current);
      } else if (Array.isArray(current)) {
        current.forEach(item => {
          if (typeof item === 'number' && item > 0) {
            ids.add(item);
          }
        });
      }
    };

    // Extract IDs
    if (Array.isArray(data)) {
      data.forEach(item => {
        fields.forEach(field => extractIds(item, field));
      });
    } else {
      fields.forEach(field => extractIds(data, field));
    }

    // Resolve names
    if (ids.size > 0) {
      const names = await this.nameResolver.getNames(Array.from(ids));

      // Apply names to data
      const applyNames = (obj: any, field: string) => {
        const parts = field.split('.');
        const nameParts = [...parts];
        nameParts[nameParts.length - 1] = `${nameParts[nameParts.length - 1]}_name`;

        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          if (current && typeof current === 'object') {
            current = current[parts[i]];
          } else {
            return;
          }
        }

        const lastPart = parts[parts.length - 1];
        if (current && typeof current[lastPart] === 'number') {
          const id = current[lastPart];
          const nameField = nameParts[nameParts.length - 1];
          current[nameField] = names.get(id) || `[${id}]`;
        }
      };

      if (Array.isArray(data)) {
        data.forEach(item => {
          fields.forEach(field => applyNames(item, field));
        });
      } else {
        fields.forEach(field => applyNames(data, field));
      }
    }
  }

  /**
   * Fetch multiple endpoints in parallel
   */
  protected async fetchMultiple<T>(
    characterId: number,
    endpoints: Array<{ path: string; ttl?: number }>
  ): Promise<T[]> {
    const promises = endpoints.map(({ path, ttl }) =>
      this.fetchWithRetry<T>(path, characterId, { ttl })
    );

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to fetch ${endpoints[index].path}:`, result.reason);
        return null as T;
      }
    }).filter(Boolean) as T[];
  }

  /**
   * Handle paginated ESI endpoints
   */
  protected async fetchPaginated<T>(
    baseEndpoint: string,
    characterId: number,
    maxPages: number = 10
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;

    while (page <= maxPages) {
      try {
        const endpoint = `${baseEndpoint}${baseEndpoint.includes('?') ? '&' : '?'}page=${page}`;
        const data = await this.fetchWithRetry<T[]>(endpoint, characterId);

        if (!data || data.length === 0) break;

        results.push(...data);
        page++;

      } catch (error) {
        console.error(`Pagination failed at page ${page}:`, error);
        break;
      }
    }

    return results;
  }

  /**
   * Cache invalidation helper
   */
  protected async invalidateCache(pattern: string): Promise<void> {
    await this.cacheManager.invalidate(pattern);
  }

  /**
   * Get character-specific cache key
   */
  protected getCacheKey(characterId: number, suffix: string): string {
    return `char:${characterId}:${suffix}`;
  }

  /**
   * Log adapter operation
   */
  protected log(message: string, data?: any): void {
    console.log(`[${this.constructor.name}] ${message}`, data || '');
  }

  /**
   * Log adapter error
   */
  protected logError(message: string, error: any): void {
    console.error(`[${this.constructor.name}] ${message}:`, error);
  }
}
