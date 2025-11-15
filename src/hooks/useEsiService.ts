import { useState, useEffect, useRef } from 'react';
import EsiCoreService, { EsiRequestOptions } from '@/services/esi/EsiCoreService';

export function useEsiService<T>(
  endpoint: string, 
  characterId?: number,
  options: {
    enabled?: boolean;
    ttl?: number;
    dependencies?: any[];
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
  } = {}
) {
  const { enabled = true, ttl, dependencies = [], method = 'GET', body } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  
  const esiService = EsiCoreService.getInstance();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      try {
        setLoading(true);
        setError(null);

        const requestOptions: EsiRequestOptions = {
          characterId,
          ttl,
          useCache: true,
          method,
          body
        };

        const response = await esiService.request<T>(endpoint, requestOptions);

        if (!abortControllerRef.current.signal.aborted) {
          setData(response.data);
          setFromCache(response.fromCache);
        }
      } catch (err: any) {
        if (!abortControllerRef.current.signal.aborted) {
          setError(err.message || 'Failed to fetch data');
          console.error('ESI Service error:', err);
        }
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [endpoint, characterId, enabled, method, JSON.stringify(body), ...dependencies]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Clear cache for this specific endpoint
      const response = await esiService.request<T>(endpoint, {
        characterId,
        ttl,
        useCache: false, // Force fresh data
        method,
        body
      });

      setData(response.data);
      setFromCache(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      console.error('ESI Service refetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fromCache, refetch };
}

/**
 * Specialized hook for character data
 */
export function useCharacterService(characterId: number | undefined, dataTypes: string[] = ['all']) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const esiService = EsiCoreService.getInstance();

  useEffect(() => {
    const loadData = async () => {
      if (!characterId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const characterData = await esiService.getCharacterData(characterId, dataTypes);
        setData(characterData);
      } catch (err: any) {
        setError(err.message || 'Failed to load character data');
        console.error('Character service error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [characterId, JSON.stringify(dataTypes)]);

  const refresh = async () => {
    if (!characterId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Clear memory cache
      esiService.clearCache('memory');
      
      const characterData = await esiService.getCharacterData(characterId, dataTypes);
      setData(characterData);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh character data');
      console.error('Character service refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
}

/**
 * Hook for bulk name resolution
 */
export function useNameResolver(ids: number[]) {
  const [names, setNames] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esiService = EsiCoreService.getInstance();

  useEffect(() => {
    if (!ids || ids.length === 0) {
      setNames(new Map());
      setLoading(false);
      return;
    }

    const resolveNames = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const resolvedNames = await esiService.resolveNames(ids);
        setNames(resolvedNames);
      } catch (err: any) {
        setError(err.message || 'Failed to resolve names');
        console.error('Name resolver error:', err);
      } finally {
        setLoading(false);
      }
    };

    resolveNames();
  }, [JSON.stringify(ids)]);

  const getName = (id: number): string => {
    return names.get(id) || `Unknown (${id})`;
  };

  return { names, getName, loading, error };
}

/**
 * Hook for ESI service statistics
 */
export function useEsiStats() {
  const [stats, setStats] = useState<any>(null);
  const esiService = EsiCoreService.getInstance();

  useEffect(() => {
    const updateStats = () => {
      setStats(esiService.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return stats;
}
