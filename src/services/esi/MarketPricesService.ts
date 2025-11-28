import { supabase } from '@/integrations/supabase/client';

export interface MarketPrice {
  type_id: number;
  average_price: number;
  adjusted_price: number;
}

/**
 * MarketPricesService - Fetch and cache EVE Online market prices
 * Uses ESI /markets/prices/ endpoint
 */
export class MarketPricesService {
  private static instance: MarketPricesService;
  private prices: Map<number, MarketPrice> = new Map();
  private lastUpdate: Date | null = null;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private isLoading = false;

  private constructor() {}

  static getInstance(): MarketPricesService {
    if (!MarketPricesService.instance) {
      MarketPricesService.instance = new MarketPricesService();
    }
    return MarketPricesService.instance;
  }

  /**
   * Get all market prices (cached)
   */
  async getPrices(): Promise<Map<number, MarketPrice>> {
    // If cache is stale, refresh
    if (!this.lastUpdate || Date.now() - this.lastUpdate.getTime() > this.CACHE_TTL) {
      await this.fetchPrices();
    }

    // If still empty after fetch, try loading from database
    if (this.prices.size === 0) {
      await this.loadFromDatabase();
    }

    return this.prices;
  }

  /**
   * Get price for a specific type ID
   */
  async getPrice(typeId: number): Promise<number> {
    const prices = await this.getPrices();
    const price = prices.get(typeId);
    return price?.average_price || 0;
  }

  /**
   * Fetch market prices from ESI and cache in database
   */
  private async fetchPrices(): Promise<void> {
    if (this.isLoading) return; // Prevent concurrent requests
    
    this.isLoading = true;
    console.log('[MarketPricesService] Fetching prices from ESI...');

    try {
      const response = await fetch('https://esi.evetech.net/latest/markets/prices/');
      
      if (!response.ok) {
        throw new Error(`ESI request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[MarketPricesService] Fetched ${data.length} prices`);

      // Clear old cache
      this.prices.clear();

      // Update memory cache
      data.forEach((item: any) => {
        this.prices.set(item.type_id, {
          type_id: item.type_id,
          average_price: item.average_price || 0,
          adjusted_price: item.adjusted_price || 0,
        });
      });

      // Store in database for persistence
      await this.storeInDatabase(data);

      this.lastUpdate = new Date();

    } catch (error: any) {
      console.error('[MarketPricesService] Failed to fetch prices:', error);
      // If fetch fails, try loading from database
      await this.loadFromDatabase();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Store prices in database
   */
  private async storeInDatabase(data: any[]): Promise<void> {
    try {
      // Batch upsert - split into smaller chunks
      const batchSize = 500;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        await supabase
          .from('market_prices_cache')
          .upsert(
            batch.map((item: any) => ({
              type_id: item.type_id,
              average_price: item.average_price || 0,
              adjusted_price: item.adjusted_price || 0,
              last_updated: new Date().toISOString(),
            })),
            { onConflict: 'type_id' }
          );
      }

      console.log('[MarketPricesService] Stored prices in database');
    } catch (error) {
      console.error('[MarketPricesService] Failed to store in database:', error);
    }
  }

  /**
   * Load prices from database
   */
  private async loadFromDatabase(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('market_prices_cache')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        this.prices.clear();
        data.forEach((row: any) => {
          this.prices.set(row.type_id, {
            type_id: row.type_id,
            average_price: row.average_price || 0,
            adjusted_price: row.adjusted_price || 0,
          });
        });

        console.log(`[MarketPricesService] Loaded ${data.length} prices from database`);
        this.lastUpdate = new Date();
      }
    } catch (error) {
      console.error('[MarketPricesService] Failed to load from database:', error);
    }
  }

  /**
   * Force refresh prices
   */
  async forceRefresh(): Promise<void> {
    this.lastUpdate = null;
    await this.fetchPrices();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.prices.clear();
    this.lastUpdate = null;
  }
}

export const marketPricesService = MarketPricesService.getInstance();
