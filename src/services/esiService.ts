import { supabase } from '@/integrations/supabase/client';

const ESI_BASE_URL = 'https://esi.evetech.net/latest';

export interface LocationData {
  solar_system_id: number;
  solar_system_name?: string;
  station_id?: number;
  station_name?: string;
  structure_id?: number;
  structure_name?: string;
}

export interface ShipData {
  ship_type_id: number;
  ship_type_name?: string;
  ship_name?: string;
  ship_item_id: number;
}

export interface CacheStatus {
  lastUpdate: Date | null;
  isStale: boolean;
  ageMinutes: number;
}

class EsiService {
  private async getAccessToken(characterId: number): Promise<string | null> {
    const { data } = await supabase
      .from('eve_characters')
      .select('access_token, expires_at')
      .eq('character_id', characterId)
      .single();

    if (!data || !data.access_token) return null;

    // Check if token is expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt <= new Date()) {
      // Token expired, need refresh
      await this.refreshCharacterToken(characterId);
      // Get refreshed token
      const { data: refreshedData } = await supabase
        .from('eve_characters')
        .select('access_token')
        .eq('character_id', characterId)
        .single();
      return refreshedData?.access_token || null;
    }

    return data.access_token;
  }

  private async refreshCharacterToken(characterId: number): Promise<void> {
    try {
      await supabase.functions.invoke('refresh-character', {
        body: { characterId }
      });
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
  }

  private async fetchEsi(endpoint: string, accessToken?: string): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${ESI_BASE_URL}${endpoint}`, { headers });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('ESI_NO_SCOPE');
      } else if (response.status === 404) {
        throw new Error('ESI_NOT_FOUND');
      } else if (response.status === 420) {
        throw new Error('ESI_ERROR_LIMIT');
      } else if (response.status >= 500) {
        throw new Error('ESI_SERVER_ERROR');
      }
      throw new Error(`ESI_ERROR_${response.status}`);
    }

    return response.json();
  }

  async getCharacterLocation(characterId: number): Promise<LocationData> {
    const accessToken = await this.getAccessToken(characterId);
    if (!accessToken) throw new Error('NO_ACCESS_TOKEN');

    const location = await this.fetchEsi(`/characters/${characterId}/location/`, accessToken);
    
    const result: LocationData = {
      solar_system_id: location.solar_system_id,
    };

    // Resolve solar system name
    const systemNames = await this.resolveUniverseNames([location.solar_system_id]);
    result.solar_system_name = systemNames.get(location.solar_system_id);

    // Check if in station or structure
    if (location.station_id) {
      result.station_id = location.station_id;
      const stationNames = await this.resolveUniverseNames([location.station_id]);
      result.station_name = stationNames.get(location.station_id);
    } else if (location.structure_id) {
      result.structure_id = location.structure_id;
      try {
        const structure = await this.fetchEsi(`/universe/structures/${location.structure_id}/`, accessToken);
        result.structure_name = structure.name;
      } catch (error) {
        result.structure_name = `Structure ${location.structure_id}`;
      }
    }

    return result;
  }

  async getCharacterShip(characterId: number): Promise<ShipData> {
    const accessToken = await this.getAccessToken(characterId);
    if (!accessToken) throw new Error('NO_ACCESS_TOKEN');

    const ship = await this.fetchEsi(`/characters/${characterId}/ship/`, accessToken);
    
    const result: ShipData = {
      ship_type_id: ship.ship_type_id,
      ship_name: ship.ship_name,
      ship_item_id: ship.ship_item_id,
    };

    // Resolve ship type name
    const typeInfo = await this.fetchEsi(`/universe/types/${ship.ship_type_id}/`);
    result.ship_type_name = typeInfo.name;

    return result;
  }

  async getCharacterWallet(characterId: number): Promise<number> {
    const accessToken = await this.getAccessToken(characterId);
    if (!accessToken) throw new Error('NO_ACCESS_TOKEN');

    return await this.fetchEsi(`/characters/${characterId}/wallet/`, accessToken);
  }

  async resolveUniverseNames(ids: number[]): Promise<Map<number, string>> {
    if (!ids || ids.length === 0) return new Map();

    const validIds = ids.filter(id => id && id > 0);
    if (validIds.length === 0) return new Map();

    // Check cache first
    const { data: cached } = await supabase
      .from('member_audit_universe_names')
      .select('id, name')
      .in('id', validIds);

    const resultMap = new Map<number, string>();
    const cachedIds = new Set<number>();

    if (cached) {
      cached.forEach(item => {
        resultMap.set(item.id, item.name);
        cachedIds.add(item.id);
      });
    }

    // Fetch missing from ESI
    const missingIds = validIds.filter(id => !cachedIds.has(id));
    
    if (missingIds.length > 0) {
      try {
        const response = await fetch('https://esi.evetech.net/latest/universe/names/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(missingIds),
        });

        if (response.ok) {
          const esiData = await response.json();
          
          // Cache new names
          if (esiData.length > 0) {
            const toCache = esiData.map((item: any) => ({
              id: item.id,
              name: item.name,
              category: item.category,
              last_updated: new Date().toISOString(),
            }));

            await supabase
              .from('member_audit_universe_names')
              .upsert(toCache, { onConflict: 'id' });
          }

          // Add to result map
          esiData.forEach((item: any) => {
            resultMap.set(item.id, item.name);
          });
        }
      } catch (error) {
        console.error('Failed to resolve universe names:', error);
      }
    }

    return resultMap;
  }

  async refreshCharacterData(characterId: number): Promise<void> {
    try {
      await supabase.functions.invoke('update-member-audit', {
        body: { characterId }
      });
    } catch (error) {
      console.error('Failed to refresh character data:', error);
      throw error;
    }
  }

  getCacheStatus(lastUpdate: string | null): CacheStatus {
    if (!lastUpdate) {
      return {
        lastUpdate: null,
        isStale: true,
        ageMinutes: Infinity,
      };
    }

    const lastUpdateDate = new Date(lastUpdate);
    const now = new Date();
    const ageMinutes = Math.floor((now.getTime() - lastUpdateDate.getTime()) / 60000);

    return {
      lastUpdate: lastUpdateDate,
      isStale: ageMinutes > 5,
      ageMinutes,
    };
  }
}

export const esiService = new EsiService();
