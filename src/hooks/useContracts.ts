import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Contract {
  id: string;
  character_id: number;
  contract_id: number;
  issuer_id: number;
  issuer_name: string | null;
  assignee_id: number | null;
  assignee_name: string | null;
  acceptor_id: number | null;
  acceptor_name: string | null;
  type: string;
  status: string;
  title: string | null;
  for_corporation: boolean | null;
  date_issued: string;
  date_accepted: string | null;
  date_completed: string | null;
  date_expired: string | null;
  price: number | null;
  reward: number | null;
  collateral: number | null;
  volume: number | null;
  start_location_id: number | null;
  start_location_name: string | null;
  end_location_id: number | null;
  end_location_name: string | null;
}

interface UseContractsOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // Default 15 minutes
}

export function useContracts(characterId: number | undefined, options: UseContractsOptions = {}) {
  const { enabled = true, autoRefresh = false, refreshInterval = 900000 } = options;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async (status?: string) => {
    if (!characterId || !enabled) return;

    try {
      setLoading(true);
      let query = supabase
        .from('member_audit_contracts')
        .select('*')
        .eq('character_id', characterId)
        .order('date_issued', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setContracts(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch contracts:', err);
    } finally {
      setLoading(false);
    }
  }, [characterId, enabled]);

  const getActiveContracts = useCallback(() => {
    return contracts.filter(c => 
      c.status === 'outstanding' || c.status === 'in_progress'
    );
  }, [contracts]);

  const getContractValue = useCallback(() => {
    return contracts.reduce((sum, c) => {
      const price = c.price || 0;
      const reward = c.reward || 0;
      return sum + price + reward;
    }, 0);
  }, [contracts]);

  const getContractsByType = useCallback((type: string) => {
    return contracts.filter(c => c.type === type);
  }, [contracts]);

  useEffect(() => {
    if (enabled && characterId) {
      fetchContracts();
    }
  }, [characterId, enabled, fetchContracts]);

  useEffect(() => {
    if (autoRefresh && characterId && enabled) {
      const interval = setInterval(() => {
        fetchContracts();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, characterId, enabled, refreshInterval, fetchContracts]);

  return {
    contracts,
    loading,
    error,
    fetchContracts,
    getActiveContracts,
    getContractValue,
    getContractsByType
  };
}
