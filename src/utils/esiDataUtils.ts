/**
 * ESI Data Utilities
 * Helpers for processing and formatting ESI data
 */

/**
 * Decode Unicode escape sequences in strings
 * Fixes issue with u'\u043f\u043f' being displayed as-is
 */
export function decodeUnicodeString(str: string | null | undefined): string {
  if (!str) return '';
  
  try {
    // Handle Python-style unicode strings like u'...'
    if (str.startsWith("u'") && str.endsWith("'")) {
      str = str.slice(2, -1);
    }
    
    // Replace unicode escape sequences
    return str.replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
  } catch (error) {
    console.error('Failed to decode unicode string:', error);
    return str;
  }
}

/**
 * Format ISK amounts with proper abbreviations
 */
export function formatISK(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00 ISK';
  }

  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1_000_000_000_000) {
    return `${(amount / 1_000_000_000_000).toFixed(2)}T ISK`;
  } else if (absAmount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)}B ISK`;
  } else if (absAmount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M ISK`;
  } else if (absAmount >= 1_000) {
    return `${(amount / 1_000).toFixed(2)}K ISK`;
  }
  
  return `${amount.toFixed(2)} ISK`;
}

/**
 * Format large numbers with proper separators
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US').format(Math.floor(num));
}

/**
 * Calculate estimated asset value from asset list
 * Uses market prices from ESI
 */
export async function calculateAssetValue(
  assets: Array<{ type_id: number; quantity: number }>,
  getPriceFunc: (typeId: number) => Promise<number>
): Promise<number> {
  if (!assets || assets.length === 0) {
    return 0;
  }

  let totalValue = 0;
  
  // Process in batches to avoid overwhelming the price service
  const BATCH_SIZE = 100;
  for (let i = 0; i < assets.length; i += BATCH_SIZE) {
    const batch = assets.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (asset) => {
        try {
          const price = await getPriceFunc(asset.type_id);
          totalValue += price * asset.quantity;
        } catch (error) {
          console.warn(`Failed to get price for type ${asset.type_id}:`, error);
        }
      })
    );
  }
  
  return totalValue;
}

/**
 * Sanitize and validate ESI endpoint
 */
export function sanitizeEndpoint(endpoint: string): string {
  // Remove leading/trailing slashes
  let sanitized = endpoint.trim().replace(/^\/+|\/+$/g, '');
  
  // Ensure it starts with /
  if (!sanitized.startsWith('/')) {
    sanitized = '/' + sanitized;
  }
  
  return sanitized;
}

/**
 * Extract character ID from various ESI response formats
 */
export function extractCharacterId(data: any): number | null {
  if (!data) return null;
  
  // Direct property
  if (data.character_id) return data.character_id;
  if (data.characterId) return data.characterId;
  if (data.id && typeof data.id === 'number') return data.id;
  
  return null;
}

/**
 * Validate ESI token scopes
 */
export function hasRequiredScopes(
  availableScopes: string[],
  requiredScopes: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredScopes.filter(
    scope => !availableScopes.includes(scope)
  );
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Parse ESI error response
 */
export interface EsiError {
  status: number;
  error: string;
  message: string;
  endpoint?: string;
}

export function parseEsiError(error: any): EsiError {
  const defaultError: EsiError = {
    status: 500,
    error: 'Unknown Error',
    message: 'An unexpected error occurred'
  };

  if (!error) return defaultError;

  // Handle different error formats
  if (error.statusCode) {
    return {
      status: error.statusCode,
      error: error.error || 'ESI Error',
      message: error.message || error.error || 'Request failed',
      endpoint: error.endpoint
    };
  }

  if (error.status) {
    return {
      status: error.status,
      error: error.statusText || 'HTTP Error',
      message: error.message || error.statusText || 'Request failed',
      endpoint: error.url
    };
  }

  return {
    ...defaultError,
    message: error.message || error.toString()
  };
}

/**
 * Generate cache key for ESI requests
 */
export function generateCacheKey(
  endpoint: string,
  method: string = 'GET',
  params?: Record<string, any>
): string {
  const parts = [
    method.toUpperCase(),
    sanitizeEndpoint(endpoint)
  ];
  
  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    parts.push(sortedParams);
  }
  
  return parts.join('::');
}

/**
 * Check if cache entry is still valid
 */
export function isCacheValid(expiresAt: string | Date): boolean {
  try {
    const expiryTime = new Date(expiresAt).getTime();
    return Date.now() < expiryTime;
  } catch {
    return false;
  }
}

/**
 * Calculate TTL based on endpoint type
 */
export function calculateTTL(endpoint: string): number {
  // Static data - cache for 30 days
  if (endpoint.includes('/universe/types/') || 
      endpoint.includes('/universe/systems/') ||
      endpoint.includes('/universe/stations/')) {
    return 30 * 24 * 60 * 60;
  }
  
  // Character location/ship - cache for 30 seconds
  if (endpoint.includes('/location/') || endpoint.includes('/ship/')) {
    return 30;
  }
  
  // Wallet - cache for 1 minute
  if (endpoint.includes('/wallet/')) {
    return 60;
  }
  
  // Skills - cache for 5 minutes
  if (endpoint.includes('/skills/')) {
    return 5 * 60;
  }
  
  // Assets - cache for 1 hour
  if (endpoint.includes('/assets/')) {
    return 60 * 60;
  }
  
  // Market data - cache for 5 minutes
  if (endpoint.includes('/markets/')) {
    return 5 * 60;
  }
  
  // Default - cache for 5 minutes
  return 5 * 60;
}
