import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const ESI_BASE_URL = 'https://esi.evetech.net/latest';

interface EsiApiOptions {
  characterId?: number;
  accessToken?: string;
  cacheTime?: number;
}

export const useEsiApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEsi = useCallback(async (
    endpoint: string,
    options: EsiApiOptions = {}
  ) => {
    const { characterId, accessToken, cacheTime = 300000 } = options;
    
    setLoading(true);
    setError(null);

    try {
      const url = characterId 
        ? `${ESI_BASE_URL}${endpoint}`.replace('{character_id}', characterId.toString())
        : `${ESI_BASE_URL}${endpoint}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setLoading(false);
      toast({
        title: 'ESI API Error',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, []);

  return { fetchEsi, loading, error };
};

// Specific hooks for common ESI endpoints

export const useCharacterInfo = (characterId?: number) => {
  const { fetchEsi } = useEsiApi();

  return useQuery({
    queryKey: ['character-info', characterId],
    queryFn: async () => {
      if (!characterId) throw new Error('Character ID required');
      return fetchEsi(`/characters/${characterId}/`, { characterId });
    },
    enabled: !!characterId,
    staleTime: 3600000, // 1 hour
  });
};

export const useCharacterSkills = (characterId?: number, accessToken?: string) => {
  const { fetchEsi } = useEsiApi();

  return useQuery({
    queryKey: ['character-skills', characterId],
    queryFn: async () => {
      if (!characterId || !accessToken) throw new Error('Character ID and access token required');
      return fetchEsi(`/characters/${characterId}/skills/`, { characterId, accessToken });
    },
    enabled: !!characterId && !!accessToken,
    staleTime: 1800000, // 30 minutes
  });
};

export const useCharacterSkillQueue = (characterId?: number, accessToken?: string) => {
  const { fetchEsi } = useEsiApi();

  return useQuery({
    queryKey: ['character-skillqueue', characterId],
    queryFn: async () => {
      if (!characterId || !accessToken) throw new Error('Character ID and access token required');
      return fetchEsi(`/characters/${characterId}/skillqueue/`, { characterId, accessToken });
    },
    enabled: !!characterId && !!accessToken,
    staleTime: 300000, // 5 minutes
  });
};

export const useCharacterWallet = (characterId?: number, accessToken?: string) => {
  const { fetchEsi } = useEsiApi();

  return useQuery({
    queryKey: ['character-wallet', characterId],
    queryFn: async () => {
      if (!characterId || !accessToken) throw new Error('Character ID and access token required');
      return fetchEsi(`/characters/${characterId}/wallet/`, { characterId, accessToken });
    },
    enabled: !!characterId && !!accessToken,
    staleTime: 60000, // 1 minute
  });
};

export const useCorporationInfo = (corporationId?: number) => {
  const { fetchEsi } = useEsiApi();

  return useQuery({
    queryKey: ['corporation-info', corporationId],
    queryFn: async () => {
      if (!corporationId) throw new Error('Corporation ID required');
      return fetchEsi(`/corporations/${corporationId}/`, { });
    },
    enabled: !!corporationId,
    staleTime: 3600000, // 1 hour
  });
};

export const useAllianceInfo = (allianceId?: number) => {
  const { fetchEsi } = useEsiApi();

  return useQuery({
    queryKey: ['alliance-info', allianceId],
    queryFn: async () => {
      if (!allianceId) throw new Error('Alliance ID required');
      return fetchEsi(`/alliances/${allianceId}/`, { });
    },
    enabled: !!allianceId,
    staleTime: 3600000, // 1 hour
  });
};

export const useCharacterAssets = (characterId?: number, accessToken?: string) => {
  const { fetchEsi } = useEsiApi();

  return useQuery({
    queryKey: ['character-assets', characterId],
    queryFn: async () => {
      if (!characterId || !accessToken) throw new Error('Character ID and access token required');
      return fetchEsi(`/characters/${characterId}/assets/`, { characterId, accessToken });
    },
    enabled: !!characterId && !!accessToken,
    staleTime: 21600000, // 6 hours
  });
};

export const useUniverseNames = (ids: number[]) => {
  const { fetchEsi } = useEsiApi();

  return useQuery({
    queryKey: ['universe-names', ids],
    queryFn: async () => {
      if (!ids || ids.length === 0) return [];
      const response = await fetch('https://esi.evetech.net/latest/universe/names/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids),
      });
      if (!response.ok) throw new Error('Failed to fetch names');
      return response.json();
    },
    enabled: ids && ids.length > 0,
    staleTime: 86400000, // 24 hours
  });
};
