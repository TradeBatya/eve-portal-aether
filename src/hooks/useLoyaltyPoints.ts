import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LoyaltyPoint {
  id: string;
  character_id: number;
  corporation_id: number;
  corporation_name: string;
  loyalty_points: number;
  last_updated: string | null;
}

interface UseLoyaltyPointsOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // Default 1 hour
}

export function useLoyaltyPoints(characterId: number | undefined, options: UseLoyaltyPointsOptions = {}) {
  const { enabled = true, autoRefresh = false, refreshInterval = 3600000 } = options;

  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoyalty = useCallback(async () => {
    if (!characterId || !enabled) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('member_audit_loyalty_points')
        .select('*')
        .eq('character_id', characterId)
        .order('loyalty_points', { ascending: false });

      if (fetchError) throw fetchError;

      setLoyaltyPoints(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch loyalty points:', err);
    } finally {
      setLoading(false);
    }
  }, [characterId, enabled]);

  const getTotalLP = useCallback(() => {
    return loyaltyPoints.reduce((sum, lp) => sum + lp.loyalty_points, 0);
  }, [loyaltyPoints]);

  const getLoyaltyByCorp = useCallback(() => {
    const grouped: Record<string, LoyaltyPoint[]> = {};
    loyaltyPoints.forEach(lp => {
      if (!grouped[lp.corporation_name]) {
        grouped[lp.corporation_name] = [];
      }
      grouped[lp.corporation_name].push(lp);
    });
    return grouped;
  }, [loyaltyPoints]);

  const getTopCorporations = useCallback((limit = 5) => {
    return [...loyaltyPoints]
      .sort((a, b) => b.loyalty_points - a.loyalty_points)
      .slice(0, limit);
  }, [loyaltyPoints]);

  useEffect(() => {
    if (enabled && characterId) {
      fetchLoyalty();
    }
  }, [characterId, enabled, fetchLoyalty]);

  useEffect(() => {
    if (autoRefresh && characterId && enabled) {
      const interval = setInterval(() => {
        fetchLoyalty();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, characterId, enabled, refreshInterval, fetchLoyalty]);

  return {
    loyaltyPoints,
    loading,
    error,
    fetchLoyalty,
    getTotalLP,
    getLoyaltyByCorp,
    getTopCorporations
  };
}
