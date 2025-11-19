import { tokenManager } from '@/services/esi/TokenManager';
import { cacheManager } from '@/services/esi/CacheManager';
import { nameResolver } from '@/services/esi/NameResolver';

/**
 * ESI Decorators - Declarative approach to ESI operations
 * Inspired by Django-ESI decorators
 */

/**
 * Requires valid token with specific scopes
 * Analogue of Django-ESI @token_required
 */
export function requiresToken(scopes: string[] = []) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const characterId = args[0];

      if (typeof characterId !== 'number') {
        throw new Error('@requiresToken: First argument must be characterId (number)');
      }

      try {
        // Validate token exists
        await tokenManager.getValidToken(characterId);

        // Validate scopes if specified
        if (scopes.length > 0) {
          const hasScopes = await tokenManager.validateScopes(characterId, scopes);
          if (!hasScopes) {
            throw new Error(`Missing required scopes: ${scopes.join(', ')}`);
          }
        }

        return await originalMethod.apply(this, args);

      } catch (error: any) {
        throw new Error(`Token validation failed for character ${characterId}: ${error.message}`);
      }
    };

    return descriptor;
  };
}

/**
 * Cache method result
 * Analogue of Django-ESI caching
 */
export function cacheResult(ttl: number, options: { tags?: string[]; priority?: number } = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Generate cache key from method name and arguments
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = await cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache result
      await cacheManager.set(cacheKey, result, ttl, options);

      return result;
    };

    return descriptor;
  };
}

/**
 * Automatically resolve IDs to names in the result
 */
export function resolveNames(fields: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      if (!result) return result;

      // Extract IDs from specified fields
      const ids = new Set<number>();
      
      const extractIds = (obj: any, fieldPath: string) => {
        const parts = fieldPath.split('.');
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

      // Extract IDs from all specified fields
      if (Array.isArray(result)) {
        result.forEach(item => {
          fields.forEach(field => extractIds(item, field));
        });
      } else {
        fields.forEach(field => extractIds(result, field));
      }

      // Resolve names
      if (ids.size > 0) {
        const names = await nameResolver.getNames(Array.from(ids));

        // Apply resolved names
        const applyNames = (obj: any, fieldPath: string) => {
          const parts = fieldPath.split('.');
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

        if (Array.isArray(result)) {
          result.forEach(item => {
            fields.forEach(field => applyNames(item, field));
          });
        } else {
          fields.forEach(field => applyNames(result, field));
        }
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Retry on failure
 */
export function retry(attempts: number = 3, delay: number = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: any;

      for (let i = 0; i < attempts; i++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;
          
          if (i < attempts - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Log method execution
 */
export function logExecution(logLevel: 'info' | 'debug' | 'warn' = 'debug') {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      
      console[logLevel](`[${propertyName}] Starting with args:`, args);

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        
        console[logLevel](`[${propertyName}] Completed in ${duration}ms`);
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        console.error(`[${propertyName}] Failed after ${duration}ms:`, error);
        
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Rate limit method calls
 */
export function rateLimit(maxCalls: number, windowMs: number) {
  const callCounts = new Map<string, { count: number; resetAt: number }>();

  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = `${propertyName}:${args[0] || 'global'}`;
      const now = Date.now();

      let record = callCounts.get(key);

      if (!record || now >= record.resetAt) {
        record = { count: 0, resetAt: now + windowMs };
        callCounts.set(key, record);
      }

      if (record.count >= maxCalls) {
        const waitTime = record.resetAt - now;
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)}s`);
      }

      record.count++;

      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
