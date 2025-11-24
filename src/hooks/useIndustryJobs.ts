import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IndustryJob {
  id: string;
  character_id: number;
  job_id: number;
  activity_id: number;
  activity_name: string;
  blueprint_id: number;
  blueprint_type_id: number;
  blueprint_type_name: string;
  blueprint_location_id: number;
  facility_id: number;
  facility_name: string | null;
  solar_system_id: number | null;
  solar_system_name: string | null;
  product_type_id: number | null;
  product_type_name: string | null;
  status: string;
  runs: number;
  cost: number | null;
  licensed_runs: number | null;
  start_date: string;
  end_date: string;
  pause_date: string | null;
}

interface UseIndustryJobsOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // Default 5 minutes
}

export function useIndustryJobs(characterId: number | undefined, options: UseIndustryJobsOptions = {}) {
  const { enabled = true, autoRefresh = false, refreshInterval = 300000 } = options;

  const [jobs, setJobs] = useState<IndustryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async (status?: string) => {
    if (!characterId || !enabled) return;

    try {
      setLoading(true);
      let query = supabase
        .from('member_audit_industry_jobs')
        .select('*')
        .eq('character_id', characterId)
        .order('start_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setJobs(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch industry jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [characterId, enabled]);

  const getActiveJobs = useCallback(() => {
    return jobs.filter(j => j.status === 'active');
  }, [jobs]);

  const getJobsByActivity = useCallback(() => {
    const grouped: Record<string, IndustryJob[]> = {};
    jobs.forEach(job => {
      if (!grouped[job.activity_name]) {
        grouped[job.activity_name] = [];
      }
      grouped[job.activity_name].push(job);
    });
    return grouped;
  }, [jobs]);

  const getTotalCost = useCallback(() => {
    return jobs.reduce((sum, j) => sum + (j.cost || 0), 0);
  }, [jobs]);

  useEffect(() => {
    if (enabled && characterId) {
      fetchJobs();
    }
  }, [characterId, enabled, fetchJobs]);

  useEffect(() => {
    if (autoRefresh && characterId && enabled) {
      const interval = setInterval(() => {
        fetchJobs();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, characterId, enabled, refreshInterval, fetchJobs]);

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    getActiveJobs,
    getJobsByActivity,
    getTotalCost
  };
}
