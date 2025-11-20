import { useState, useEffect, useCallback } from 'react';
import { walletAdapter, WalletBalance } from '@/services/esi/adapters/WalletAdapter';
import type { WalletJournalEntry, WalletTransaction } from '@/services/esi/adapters/WalletAdapter';

interface UseWalletOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useWallet(characterId: number | undefined, options: UseWalletOptions = {}) {
  const { enabled = true, autoRefresh = false, refreshInterval = 60000 } = options;

  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [journal, setJournal] = useState<WalletJournalEntry[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!characterId || !enabled) return;

    try {
      const data = await walletAdapter.getBalance(characterId);
      setBalance(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [characterId, enabled]);

  const fetchJournal = useCallback(async (fromDate?: Date) => {
    if (!characterId || !enabled) return;

    try {
      const data = await walletAdapter.getJournal(characterId, fromDate);
      setJournal(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [characterId, enabled]);

  const fetchTransactions = useCallback(async (limit = 100) => {
    if (!characterId || !enabled) return;

    try {
      const data = await walletAdapter.getTransactions(characterId, limit);
      setTransactions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [characterId, enabled]);

  const fetchSummary = useCallback(async () => {
    if (!characterId || !enabled) return;

    try {
      setLoading(true);
      const data = await walletAdapter.getSummary(characterId);
      setSummary(data);
      setBalance({ balance: data.balance, lastUpdated: data.lastUpdated });
      setJournal(data.recentJournal || []);
      setTransactions(data.recentTransactions || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [characterId, enabled]);

  const refresh = useCallback(async () => {
    if (!characterId) return;

    try {
      setLoading(true);
      await walletAdapter.refresh(characterId);
      await fetchSummary();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [characterId, fetchSummary]);

  useEffect(() => {
    if (enabled && characterId) {
      fetchSummary();
    }
  }, [characterId, enabled, fetchSummary]);

  useEffect(() => {
    if (autoRefresh && characterId && enabled) {
      const interval = setInterval(() => {
        fetchSummary();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, characterId, enabled, refreshInterval, fetchSummary]);

  return {
    balance,
    journal,
    transactions,
    summary,
    loading,
    error,
    fetchBalance,
    fetchJournal,
    fetchTransactions,
    fetchSummary,
    refresh
  };
}
