import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MemberAuditMetadata {
  id: string;
  character_id: number;
  user_id: string;
  last_full_sync_at: string | null;
  last_update_at: string;
  sync_status: 'pending' | 'syncing' | 'completed' | 'failed';
  sync_progress: Record<string, number>;
  sync_errors: string[];
  enabled_modules: Record<string, boolean>;
  total_sp: number;
  unallocated_sp: number;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateMemberAuditParams {
  character_id: number;
  modules?: string[];
}

/**
 * Fetch member audit metadata for a character
 */
export const useMemberAuditMetadata = (characterId?: number) => {
  return useQuery({
    queryKey: ['member-audit-metadata', characterId],
    queryFn: async () => {
      if (!characterId) return null;

      const { data, error } = await supabase
        .from('member_audit_metadata')
        .select('*')
        .eq('character_id', characterId)
        .maybeSingle();

      if (error) throw error;
      return data as MemberAuditMetadata | null;
    },
    enabled: !!characterId,
  });
};

/**
 * Update member audit data for a character
 */
export const useUpdateMemberAudit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: UpdateMemberAuditParams) => {
      const { data, error } = await supabase.functions.invoke('update-member-audit', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ 
        queryKey: ['member-audit-metadata', variables.character_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['member-audit-skills', variables.character_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['member-audit-wallet', variables.character_id] 
      });

      if (data.success) {
        toast({
          title: 'Sync Completed',
          description: 'Character data has been updated successfully',
        });
      } else {
        toast({
          title: 'Sync Completed with Errors',
          description: `Some modules failed: ${data.errors?.join(', ')}`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Fetch character skills
 */
export const useMemberAuditSkills = (characterId?: number) => {
  return useQuery({
    queryKey: ['member-audit-skills', characterId],
    queryFn: async () => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('member_audit_skills')
        .select('*')
        .eq('character_id', characterId)
        .order('skill_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!characterId,
  });
};

/**
 * Fetch character skill queue
 */
export const useMemberAuditSkillqueue = (characterId?: number) => {
  return useQuery({
    queryKey: ['member-audit-skillqueue', characterId],
    queryFn: async () => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('member_audit_skillqueue')
        .select('*')
        .eq('character_id', characterId)
        .order('queue_position');

      if (error) throw error;
      return data || [];
    },
    enabled: !!characterId,
  });
};

/**
 * Fetch character wallet journal
 */
export const useMemberAuditWalletJournal = (characterId?: number, limit = 100) => {
  return useQuery({
    queryKey: ['member-audit-wallet-journal', characterId, limit],
    queryFn: async () => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('member_audit_wallet_journal')
        .select('*')
        .eq('character_id', characterId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!characterId,
  });
};

/**
 * Fetch character wallet transactions
 */
export const useMemberAuditWalletTransactions = (characterId?: number, limit = 100) => {
  return useQuery({
    queryKey: ['member-audit-wallet-transactions', characterId, limit],
    queryFn: async () => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('member_audit_wallet_transactions')
        .select('*')
        .eq('character_id', characterId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!characterId,
  });
};

/**
 * Fetch character implants
 */
export const useMemberAuditImplants = (characterId?: number) => {
  return useQuery({
    queryKey: ['member-audit-implants', characterId],
    queryFn: async () => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('member_audit_implants')
        .select('*')
        .eq('character_id', characterId)
        .order('slot');

      if (error) throw error;
      return data || [];
    },
    enabled: !!characterId,
  });
};

/**
 * Fetch character clones
 */
export const useMemberAuditClones = (characterId?: number) => {
  return useQuery({
    queryKey: ['member-audit-clones', characterId],
    queryFn: async () => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('member_audit_clones')
        .select('*')
        .eq('character_id', characterId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!characterId,
  });
};

/**
 * Fetch character contacts
 */
export const useMemberAuditContacts = (characterId?: number) => {
  return useQuery({
    queryKey: ['member-audit-contacts', characterId],
    queryFn: async () => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('member_audit_contacts')
        .select('*')
        .eq('character_id', characterId)
        .order('standing', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!characterId,
  });
};

/**
 * Fetch character contracts
 */
export const useMemberAuditContracts = (characterId?: number) => {
  return useQuery({
    queryKey: ['member-audit-contracts', characterId],
    queryFn: async () => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('member_audit_contracts')
        .select('*')
        .eq('character_id', characterId)
        .order('date_issued', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!characterId,
  });
};

/**
 * Fetch character industry jobs
 */
export const useMemberAuditIndustryJobs = (characterId?: number) => {
  return useQuery({
    queryKey: ['member-audit-industry-jobs', characterId],
    queryFn: async () => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('member_audit_industry_jobs')
        .select('*')
        .eq('character_id', characterId)
        .order('end_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!characterId,
  });
};

/**
 * Fetch character loyalty points
 */
export const useMemberAuditLoyaltyPoints = (characterId?: number) => {
  return useQuery({
    queryKey: ['member-audit-loyalty-points', characterId],
    queryFn: async () => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('member_audit_loyalty_points')
        .select('*')
        .eq('character_id', characterId)
        .order('loyalty_points', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!characterId,
  });
};

/**
 * Fetch ESI logs for debugging
 */
export const useMemberAuditESILogs = (characterId?: number, limit = 50) => {
  return useQuery({
    queryKey: ['member-audit-esi-logs', characterId, limit],
    queryFn: async () => {
      if (!characterId) return [];

      const { data, error } = await supabase
        .from('member_audit_esi_logs')
        .select('*')
        .eq('character_id', characterId)
        .order('request_timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!characterId,
  });
};
