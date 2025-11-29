import { supabase } from '@/integrations/supabase/client';

export interface TokenData {
  characterId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scopes: string[];
}

export interface TokenValidation {
  isValid: boolean;
  expiresIn: number;
  needsRefresh: boolean;
}

/**
 * TokenManager - Centralized token management system
 * Analogue of Django-ESI TokenManager
 */
export class TokenManager {
  private static instance: TokenManager;
  private refreshQueue = new Map<number, Promise<string>>();
  private readonly REFRESH_BUFFER = 10 * 60 * 1000; // 10 minutes

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Get valid token with automatic refresh if needed
   * Analogue of Django-ESI get_token_for_character
   */
  async getValidToken(characterId: number | null | undefined): Promise<string> {
    // Phase 2: Null-safe character ID validation
    if (!characterId || typeof characterId !== 'number') {
      throw new Error('Invalid character ID provided');
    }

    try {
      // Check if refresh is already in progress
      if (this.refreshQueue.has(characterId)) {
        return await this.refreshQueue.get(characterId)!;
      }

      // Try esi_service_tokens first
      const { data: tokenData } = await supabase
        .from('esi_service_tokens')
        .select('access_token, expires_at, refresh_token')
        .eq('character_id', characterId)
        .maybeSingle(); // Phase 2: Use maybeSingle for null-safety

      if (tokenData) {
        const validation = this.validateToken(tokenData.expires_at);
        
        if (validation.needsRefresh) {
          return await this.refreshToken(characterId, tokenData.refresh_token);
        }
        
        if (validation.isValid) {
          return tokenData.access_token;
        }
      }

      // Fallback to eve_characters
      const { data: charData } = await supabase
        .from('eve_characters')
        .select('access_token, expires_at, refresh_token, scopes')
        .eq('character_id', characterId)
        .maybeSingle(); // Phase 2: Use maybeSingle for null-safety

      if (!charData) {
        throw new Error(`No token found for character ${characterId}`);
      }

      const validation = this.validateToken(charData.expires_at);
      
      if (validation.needsRefresh) {
        return await this.refreshToken(characterId, charData.refresh_token);
      }

      // Sync to esi_service_tokens
      await this.syncToken(characterId, charData);
      
      return charData.access_token;

    } catch (error: any) {
      console.error(`TokenManager: Failed to get token for character ${characterId}:`, error);
      throw new Error(`Token acquisition failed: ${error.message}`);
    }
  }

  /**
   * Validate if token is still valid
   */
  private validateToken(expiresAt: string | null | undefined): TokenValidation {
    // Phase 2: Null-safe validation
    if (!expiresAt) {
      return {
        isValid: false,
        expiresIn: 0,
        needsRefresh: false
      };
    }

    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const expiresIn = expiryTime - now;

    return {
      isValid: expiresIn > 0,
      expiresIn,
      needsRefresh: expiresIn < this.REFRESH_BUFFER && expiresIn > 0
    };
  }

  /**
   * Refresh token using OAuth
   * Analogue of Django-ESI refresh_access_token
   */
  async refreshToken(characterId: number, refreshToken: string): Promise<string> {
    // Prevent duplicate refresh requests
    if (this.refreshQueue.has(characterId)) {
      return await this.refreshQueue.get(characterId)!;
    }

    const refreshPromise = this.executeRefresh(characterId, refreshToken);
    this.refreshQueue.set(characterId, refreshPromise);

    try {
      const newToken = await refreshPromise;
      return newToken;
    } finally {
      this.refreshQueue.delete(characterId);
    }
  }

  private async executeRefresh(characterId: number, refreshToken: string): Promise<string> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/esi-token-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ characterId, refreshToken })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const { accessToken } = await response.json();
      return accessToken;

    } catch (error: any) {
      console.error(`Token refresh failed for character ${characterId}:`, error);
      
      // Mark token as failed
      await this.markTokenValidationFailure(characterId);
      
      throw error;
    }
  }

  /**
   * Validate if character has required scopes
   * Analogue of Django-ESI token_has_scopes
   */
  async validateScopes(characterId: number, requiredScopes: string[]): Promise<boolean> {
    if (requiredScopes.length === 0) return true;
    if (!characterId || typeof characterId !== 'number') return false; // Phase 2: Null-safe

    try {
      const { data: tokenData } = await supabase
        .from('esi_service_tokens')
        .select('scopes')
        .eq('character_id', characterId)
        .maybeSingle(); // Phase 2: Use maybeSingle

      if (!tokenData) {
        // Try eve_characters
        const { data: charData } = await supabase
          .from('eve_characters')
          .select('scopes')
          .eq('character_id', characterId)
          .maybeSingle(); // Phase 2: Use maybeSingle

        if (!charData) return false;
        return this.checkScopes(charData.scopes || [], requiredScopes);
      }

      return this.checkScopes(tokenData.scopes || [], requiredScopes);

    } catch (error) {
      console.error(`Scope validation failed for character ${characterId}:`, error);
      return false;
    }
  }

  private checkScopes(availableScopes: string[] | null | undefined, requiredScopes: string[]): boolean {
    if (!availableScopes || !Array.isArray(availableScopes)) return false; // Phase 2: Null-safe
    return requiredScopes.every(scope => availableScopes.includes(scope));
  }

  /**
   * Get all expired tokens for background refresh
   */
  async getExpiredTokens(): Promise<number[]> {
    const bufferTime = new Date(Date.now() + this.REFRESH_BUFFER);

    const { data: tokens } = await supabase
      .from('esi_service_tokens')
      .select('character_id')
      .lt('expires_at', bufferTime.toISOString())
      .eq('auto_refresh_enabled', true);

    return tokens?.map(t => t.character_id) || [];
  }

  /**
   * Sync token from eve_characters to esi_service_tokens
   * Phase 1: Explicitly sync scopes and reset validation failures
   */
  private async syncToken(characterId: number, charData: any): Promise<void> {
    try {
      // Get scopes from eve_characters if not provided
      let scopes = charData.scopes || [];
      
      if (!scopes.length) {
        const { data } = await supabase
          .from('eve_characters')
          .select('scopes')
          .eq('character_id', characterId)
          .single();
        scopes = data?.scopes || [];
      }

      await supabase
        .from('esi_service_tokens')
        .upsert({
          character_id: characterId,
          access_token: charData.access_token,
          refresh_token: charData.refresh_token,
          expires_at: charData.expires_at,
          scopes: scopes, // Explicitly set scopes
          token_type: 'Bearer',
          last_validated_at: new Date().toISOString(),
          validation_failures: 0, // Reset failures
          auto_refresh_enabled: true // Enable auto-refresh
        });
      
      console.log(`[TokenManager] Synced token with ${scopes.length} scopes for character ${characterId}`);
    } catch (error) {
      console.error(`Token sync failed for character ${characterId}:`, error);
    }
  }

  /**
   * Manually sync scopes from eve_characters to esi_service_tokens
   * Phase 1: Public method for manual scope synchronization
   */
  async syncScopesFromEveCharacters(characterId: number): Promise<void> {
    try {
      const { data } = await supabase
        .from('eve_characters')
        .select('scopes')
        .eq('character_id', characterId)
        .single();

      if (data?.scopes) {
        await supabase
          .from('esi_service_tokens')
          .update({ 
            scopes: data.scopes,
            validation_failures: 0,
            auto_refresh_enabled: true,
            last_validated_at: new Date().toISOString()
          })
          .eq('character_id', characterId);
        
        console.log(`[TokenManager] Manually synced ${data.scopes.length} scopes for character ${characterId}`);
      }
    } catch (error) {
      console.error(`Manual scope sync failed for character ${characterId}:`, error);
    }
  }

  /**
   * Mark token validation failure
   */
  private async markTokenValidationFailure(characterId: number): Promise<void> {
    try {
      const { data } = await supabase
        .from('esi_service_tokens')
        .select('validation_failures')
        .eq('character_id', characterId)
        .single();

      const failures = (data?.validation_failures || 0) + 1;

      await supabase
        .from('esi_service_tokens')
        .update({
          validation_failures: failures,
          auto_refresh_enabled: failures < 5 // Disable after 5 failures
        })
        .eq('character_id', characterId);

    } catch (error) {
      console.error(`Failed to mark token failure for ${characterId}:`, error);
    }
  }

  /**
   * Cleanup invalid tokens
   */
  async cleanupInvalidTokens(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('esi_service_tokens')
        .delete()
        .or('validation_failures.gte.5,expires_at.lt.' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .select('character_id');

      if (error) throw error;
      return data?.length || 0;

    } catch (error) {
      console.error('Token cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Force token refresh for a character
   */
  async forceRefresh(characterId: number): Promise<void> {
    const { data } = await supabase
      .from('esi_service_tokens')
      .select('refresh_token')
      .eq('character_id', characterId)
      .single();

    if (data?.refresh_token) {
      await this.refreshToken(characterId, data.refresh_token);
    }
  }

  /**
   * Get token statistics
   */
  async getTokenStats(): Promise<any> {
    const { data: tokens } = await supabase
      .from('esi_service_tokens')
      .select('character_id, expires_at, validation_failures, auto_refresh_enabled');

    if (!tokens) return null;

    const now = Date.now();
    const stats = {
      total: tokens.length,
      valid: 0,
      expiring: 0,
      expired: 0,
      failed: 0,
      autoRefreshDisabled: 0
    };

    tokens.forEach(token => {
      const expiresAt = new Date(token.expires_at).getTime();
      const timeToExpiry = expiresAt - now;

      if (timeToExpiry < 0) {
        stats.expired++;
      } else if (timeToExpiry < this.REFRESH_BUFFER) {
        stats.expiring++;
      } else {
        stats.valid++;
      }

      if (token.validation_failures > 0) stats.failed++;
      if (!token.auto_refresh_enabled) stats.autoRefreshDisabled++;
    });

    return stats;
  }
}

export const tokenManager = TokenManager.getInstance();
