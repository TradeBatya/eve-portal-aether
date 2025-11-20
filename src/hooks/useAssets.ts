import { useState, useEffect, useCallback } from 'react';
import { assetsAdapter, Asset, AssetSummary } from '@/services/esi/adapters/AssetsAdapter';

interface UseAssetsOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useAssets(characterId: number | undefined, options: UseAssetsOptions = {}) {
  const { enabled = true, autoRefresh = false, refreshInterval = 300000 } = options;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!characterId || !enabled) return;
    try {
      setLoading(true);
      const data = await assetsAdapter.getAssets(characterId);
      setAssets(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [characterId, enabled]);

  const getAssetsByLocation = useCallback(async (locationId: number) => {
    if (!characterId) return [];
    try {
      const allAssets = await assetsAdapter.getAssets(characterId);
      return allAssets.filter(asset => asset.locationId === locationId);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, [characterId]);

  const searchAssets = useCallback(async (query: string) => {
    if (!characterId) return [];
    try {
      return await assetsAdapter.searchAssets(characterId, query);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, [characterId]);

  const fetchSummary = useCallback(async () => {
    if (!characterId || !enabled) return;
    try {
      const data = await assetsAdapter.getSummary(characterId);
      setSummary(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [characterId, enabled]);

  useEffect(() => {
    if (enabled && characterId) {
      Promise.all([fetchAssets(), fetchSummary()]);
    }
  }, [characterId, enabled, fetchAssets, fetchSummary]);

  return { assets, summary, loading, error, fetchAssets, getAssetsByLocation, searchAssets, fetchSummary };
}
