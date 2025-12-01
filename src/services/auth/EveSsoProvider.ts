import { supabase } from '@/integrations/supabase/client';

export interface AuthorizationUrl {
  url: string;
  state: string;
}

export interface AuthResult {
  characterId: number;
  characterName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scopes: string[];
}

/**
 * EveSsoProvider - OAuth authentication with EVE SSO
 * Analogue of Django-ESI EVE SSO provider
 */
export class EveSsoProvider {
  private static instance: EveSsoProvider;
  private readonly clientId = import.meta.env.VITE_EVE_CLIENT_ID;
  private readonly ssoUrl = 'https://login.eveonline.com/v2/oauth/authorize';
  private readonly callbackUrl = `${window.location.origin}/eve-callback`;
  
  private stateMap = new Map<string, { created: number; userId?: string }>();
  private readonly STATE_TTL = 10 * 60 * 1000; // 10 minutes

  private constructor() {
    this.cleanupExpiredStates();
  }

  static getInstance(): EveSsoProvider {
    if (!EveSsoProvider.instance) {
      EveSsoProvider.instance = new EveSsoProvider();
    }
    return EveSsoProvider.instance;
  }

  /**
   * Generate authorization URL for EVE SSO
   * Analogue of Django-ESI get_sso_url
   */
  getAuthorizationUrl(scopes: string[], userId?: string): AuthorizationUrl {
    const state = this.generateState();
    
    // Store state with metadata
    this.stateMap.set(state, {
      created: Date.now(),
      userId
    });

    const params = new URLSearchParams({
      response_type: 'code',
      redirect_uri: this.callbackUrl,
      client_id: this.clientId,
      scope: scopes.join(' '),
      state
    });

    const url = `${this.ssoUrl}?${params.toString()}`;

    return { url, state };
  }

  /**
   * Generate secure state parameter
   */
  generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate state parameter
   */
  validateState(state: string): boolean {
    const stateData = this.stateMap.get(state);
    
    if (!stateData) {
      return false;
    }

    // Check if state is still valid
    const age = Date.now() - stateData.created;
    if (age > this.STATE_TTL) {
      this.stateMap.delete(state);
      return false;
    }

    return true;
  }

  /**
   * Get user ID associated with state
   */
  getUserIdFromState(state: string): string | undefined {
    return this.stateMap.get(state)?.userId;
  }

  /**
   * Clean up state after use
   */
  cleanupState(state: string): void {
    this.stateMap.delete(state);
  }

  /**
   * Handle OAuth callback
   * Analogue of Django-ESI callback handler
   */
  async handleCallback(code: string, state: string): Promise<AuthResult> {
    // Validate state
    if (!this.validateState(state)) {
      throw new Error('Invalid or expired state parameter');
    }

    const userId = this.getUserIdFromState(state);
    this.cleanupState(state);

    try {
      // Exchange code for tokens via edge function
      const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY 
        || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eve-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({ code, userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const data = await response.json();

      return {
        characterId: data.character_id,
        characterName: data.character_name,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        scopes: data.scopes
      };

    } catch (error: any) {
      console.error('OAuth callback failed:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Get default scopes for character authentication
   */
  getDefaultScopes(): string[] {
    return [
      // Character data
      'esi-characters.read_standings.v1',
      'esi-characters.read_agents_research.v1',
      'esi-characters.read_blueprints.v1',
      'esi-characters.read_corporation_roles.v1',
      'esi-characters.read_fatigue.v1',
      'esi-characters.read_fw_stats.v1',
      'esi-characters.read_loyalty.v1',
      'esi-characters.read_medals.v1',
      'esi-characters.read_notifications.v1',
      'esi-characters.read_opportunities.v1',
      'esi-characters.read_titles.v1',
      
      // Skills
      'esi-skills.read_skills.v1',
      'esi-skills.read_skillqueue.v1',
      
      // Wallet
      'esi-wallet.read_character_wallet.v1',
      
      // Assets
      'esi-assets.read_assets.v1',
      
      // Location
      'esi-location.read_location.v1',
      'esi-location.read_ship_type.v1',
      'esi-location.read_online.v1',
      
      // Clones
      'esi-clones.read_clones.v1',
      'esi-clones.read_implants.v1',
      
      // Contacts
      'esi-characters.read_contacts.v1',
      
      // Contracts
      'esi-contracts.read_character_contracts.v1',
      
      // Industry
      'esi-industry.read_character_jobs.v1',
      'esi-industry.read_character_mining.v1',
      
      // Mail
      'esi-mail.read_mail.v1',
      
      // Market
      'esi-markets.read_character_orders.v1',
      
      // Universe
      'esi-universe.read_structures.v1'
    ];
  }

  /**
   * Decode JWT token to get character info
   */
  decodeJwt(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      
      return JSON.parse(decoded);

    } catch (error) {
      console.error('JWT decode failed:', error);
      return null;
    }
  }

  /**
   * Verify character ownership via JWT
   */
  async verifyCharacterOwnership(accessToken: string, characterId: number): Promise<boolean> {
    const jwt = this.decodeJwt(accessToken);
    
    if (!jwt) return false;

    // Check if character ID matches
    const tokenCharId = jwt.sub?.split(':')[2];
    
    return tokenCharId === characterId.toString();
  }

  /**
   * Periodic cleanup of expired states
   */
  private cleanupExpiredStates(): void {
    setInterval(() => {
      const now = Date.now();
      const toDelete: string[] = [];

      this.stateMap.forEach((data, state) => {
        if (now - data.created > this.STATE_TTL) {
          toDelete.push(state);
        }
      });

      toDelete.forEach(state => this.stateMap.delete(state));

      if (toDelete.length > 0) {
        console.log(`Cleaned up ${toDelete.length} expired OAuth states`);
      }
    }, 60 * 1000); // Every minute
  }

  /**
   * Get SSO login URL with default scopes
   */
  getLoginUrl(userId?: string): string {
    const scopes = this.getDefaultScopes();
    const { url } = this.getAuthorizationUrl(scopes, userId);
    return url;
  }

  /**
   * Add character to existing account
   */
  getAddCharacterUrl(userId: string): string {
    const scopes = this.getDefaultScopes();
    const { url } = this.getAuthorizationUrl(scopes, userId);
    return url;
  }
}

export const eveSsoProvider = EveSsoProvider.getInstance();
