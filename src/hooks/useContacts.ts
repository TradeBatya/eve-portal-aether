import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Contact {
  id: string;
  character_id: number;
  contact_id: number;
  contact_name: string;
  contact_type: string;
  standing: number;
  is_blocked: boolean | null;
  is_watched: boolean | null;
  label_ids: any;
  last_updated: string | null;
}

interface UseContactsOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // Default 1 hour
}

export function useContacts(characterId: number | undefined, options: UseContactsOptions = {}) {
  const { enabled = true, autoRefresh = false, refreshInterval = 3600000 } = options;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!characterId || !enabled) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('member_audit_contacts')
        .select('*')
        .eq('character_id', characterId)
        .order('standing', { ascending: false });

      if (fetchError) throw fetchError;

      setContacts(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [characterId, enabled]);

  const searchContacts = useCallback((query: string) => {
    if (!query) return contacts;
    return contacts.filter(c => 
      c.contact_name.toLowerCase().includes(query.toLowerCase())
    );
  }, [contacts]);

  const getContactsByStanding = useCallback((minStanding: number, maxStanding: number) => {
    return contacts.filter(c => 
      c.standing >= minStanding && c.standing <= maxStanding
    );
  }, [contacts]);

  const getContactsByType = useCallback((type: string) => {
    return contacts.filter(c => c.contact_type === type);
  }, [contacts]);

  useEffect(() => {
    if (enabled && characterId) {
      fetchContacts();
    }
  }, [characterId, enabled, fetchContacts]);

  useEffect(() => {
    if (autoRefresh && characterId && enabled) {
      const interval = setInterval(() => {
        fetchContacts();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, characterId, enabled, refreshInterval, fetchContacts]);

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    searchContacts,
    getContactsByStanding,
    getContactsByType
  };
}
