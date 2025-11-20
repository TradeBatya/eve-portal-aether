import { useState, useEffect, useCallback } from 'react';
import { skillsAdapter, SkillData, SkillQueueItem } from '@/services/esi/adapters/SkillsAdapter';

interface UseSkillsOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useSkills(characterId: number | undefined, options: UseSkillsOptions = {}) {
  const { enabled = true, autoRefresh = false, refreshInterval = 60000 } = options;

  const [skills, setSkills] = useState<SkillData | null>(null);
  const [skillQueue, setSkillQueue] = useState<SkillQueueItem[]>([]);
  const [completeData, setCompleteData] = useState<SkillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    if (!characterId || !enabled) return;

    try {
      const data = await skillsAdapter.getSkills(characterId);
      setSkills(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [characterId, enabled]);

  const fetchSkillQueue = useCallback(async () => {
    if (!characterId || !enabled) return;

    try {
      const data = await skillsAdapter.getSkillQueue(characterId);
      setSkillQueue(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [characterId, enabled]);

  const fetchCompleteData = useCallback(async () => {
    if (!characterId || !enabled) return;

    try {
      setLoading(true);
      const data = await skillsAdapter.getSkills(characterId);
      setCompleteData(data);
      setSkills(data);
      setSkillQueue(data.skillQueue);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [characterId, enabled]);

  const getSkillsByGroup = useCallback(async () => {
    if (!characterId) return new Map();

    try {
      return await skillsAdapter.getSkillsByGroup(characterId);
    } catch (err: any) {
      setError(err.message);
      return new Map();
    }
  }, [characterId]);

  const getTrainingProgress = useCallback(async () => {
    if (!characterId) return null;

    try {
      return await skillsAdapter.getTrainingProgress(characterId);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [characterId]);

  const calculateTrainingTime = useCallback(async (): Promise<number> => {
    if (!characterId) return 0;

    try {
      return await skillsAdapter.calculateTrainingTime(characterId);
    } catch (err: any) {
      setError(err.message);
      return 0;
    }
  }, [characterId]);

  const refresh = useCallback(async () => {
    if (!characterId) return;

    try {
      setLoading(true);
      await skillsAdapter.refresh(characterId);
      await fetchCompleteData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [characterId, fetchCompleteData]);

  useEffect(() => {
    if (enabled && characterId) {
      fetchCompleteData();
    }
  }, [characterId, enabled, fetchCompleteData]);

  useEffect(() => {
    if (autoRefresh && characterId && enabled) {
      const interval = setInterval(() => {
        fetchCompleteData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, characterId, enabled, refreshInterval, fetchCompleteData]);

  return {
    skills,
    skillQueue,
    completeData,
    loading,
    error,
    fetchSkills,
    fetchSkillQueue,
    fetchCompleteData,
    getSkillsByGroup,
    getTrainingProgress,
    calculateTrainingTime,
    refresh
  };
}
