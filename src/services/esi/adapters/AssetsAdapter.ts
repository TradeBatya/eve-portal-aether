import { BaseAdapter } from './BaseAdapter';

export interface Asset {
  itemId: number;
  typeId: number;
  typeName?: string;
  locationId: number;
  locationName?: string;
  locationType?: string;
  quantity: number;
  isSingleton: boolean;
  isBlueprintCopy?: boolean;
  estimatedValue?: number; // Phase 5: Add estimated value
}

export interface AssetLocation {
  locationId: number;
  locationName?: string;
  locationType: string;
  totalItems: number;
  assets: Asset[];
}

export interface AssetSummary {
  totalItems: number;
  uniqueTypes: number;
  locationCount: number;
  totalValue: number; // Phase 5: Add total estimated value
  locations: AssetLocation[];
}

/**
 * AssetsAdapter - Character assets and inventory
 */
export class AssetsAdapter extends BaseAdapter {

  async getAssets(characterId: number): Promise<Asset[]> {
    await this.validateToken(characterId, ['esi-assets.read_assets.v1']);
    this.log(`Fetching assets for character ${characterId}`);

    const assetsData = await this.fetchWithRetry<any[]>(
      `/characters/${characterId}/assets/`,
      characterId,
      { ttl: 3600 }
    );

    if (!assetsData || assetsData.length === 0) {
      return [];
    }

    const assets: Asset[] = assetsData.map((asset: any) => ({
      itemId: asset.item_id,
      typeId: asset.type_id,
      locationId: asset.location_id,
      quantity: asset.quantity,
      isSingleton: asset.is_singleton,
      isBlueprintCopy: asset.is_blueprint_copy,
      estimatedValue: 0 // Will be calculated below
    }));

    // Resolve type names
    const typeIds = [...new Set(assets.map(a => a.typeId))];
    const typeNames = await this.nameResolver.getNames(typeIds);
    
    assets.forEach(asset => {
      asset.typeName = typeNames.get(asset.typeId) || `[${asset.typeId}]`;
    });

    // Resolve location names
    const locationIds = [...new Set(assets.map(a => a.locationId))];
    const locationNames = await this.nameResolver.getNames(locationIds);
    
    assets.forEach(asset => {
      asset.locationName = locationNames.get(asset.locationId) || `[${asset.locationId}]`;
      
      // Determine location type
      if (asset.locationId >= 60000000 && asset.locationId < 64000000) {
        asset.locationType = 'station';
      } else if (asset.locationId >= 1000000000000) {
        asset.locationType = 'structure';
      } else {
        asset.locationType = 'unknown';
      }
    });

    // Phase 5: Calculate estimated value using market prices
    try {
      const { marketPricesService } = await import('../MarketPricesService');
      const marketPrices = await marketPricesService.getPrices();
      
      assets.forEach(asset => {
        const price = marketPrices.get(asset.typeId);
        asset.estimatedValue = price 
          ? price.average_price * asset.quantity 
          : 0;
      });
      
      this.log(`Calculated estimated values for ${assets.length} assets`);
    } catch (error) {
      console.error('[AssetsAdapter] Failed to calculate asset values:', error);
    }

    return assets;
  }

  /**
   * Get assets grouped by location
   */
  async getAssetsByLocation(characterId: number): Promise<AssetLocation[]> {
    this.log(`Grouping assets by location for character ${characterId}`);

    const assets = await this.getAssets(characterId);

    // Group by location
    const locationMap = new Map<number, Asset[]>();
    
    assets.forEach(asset => {
      const existing = locationMap.get(asset.locationId) || [];
      existing.push(asset);
      locationMap.set(asset.locationId, existing);
    });

    // Convert to array
    const locations: AssetLocation[] = [];
    
    locationMap.forEach((assets, locationId) => {
      locations.push({
        locationId,
        locationName: assets[0].locationName,
        locationType: assets[0].locationType || 'unknown',
        totalItems: assets.reduce((sum, a) => sum + a.quantity, 0),
        assets
      });
    });

    // Sort by total items descending
    locations.sort((a, b) => b.totalItems - a.totalItems);

    return locations;
  }

  /**
   * Search assets by name
   */
  async searchAssets(characterId: number, query: string): Promise<Asset[]> {
    this.log(`Searching assets for character ${characterId} with query: ${query}`);

    const assets = await this.getAssets(characterId);
    const lowerQuery = query.toLowerCase();

    return assets.filter(asset => 
      asset.typeName?.toLowerCase().includes(lowerQuery) ||
      asset.locationName?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get assets at specific location
   */
  async getAssetsAtLocation(characterId: number, locationId: number): Promise<Asset[]> {
    this.log(`Fetching assets at location ${locationId} for character ${characterId}`);

    const assets = await this.getAssets(characterId);
    
    return assets.filter(asset => asset.locationId === locationId);
  }

  /**
   * Get asset summary
   */
  async getSummary(characterId: number): Promise<AssetSummary> {
    this.log(`Generating asset summary for character ${characterId}`);

    const locations = await this.getAssetsByLocation(characterId);
    
    const totalItems = locations.reduce((sum, loc) => sum + loc.totalItems, 0);
    
    const uniqueTypes = new Set<number>();
    let totalValue = 0; // Phase 5: Calculate total value
    
    locations.forEach(loc => {
      loc.assets.forEach(asset => {
        uniqueTypes.add(asset.typeId);
        if (asset.estimatedValue) {
          totalValue += asset.estimatedValue;
        }
      });
    });

    return {
      totalItems,
      uniqueTypes: uniqueTypes.size,
      locationCount: locations.length,
      totalValue, // Phase 5: Include total value
      locations: locations.slice(0, 10) // Top 10 locations
    };
  }

  /**
   * Get strategic assets (ships, expensive modules, etc)
   */
  async getStrategicAssets(characterId: number): Promise<Asset[]> {
    this.log(`Fetching strategic assets for character ${characterId}`);

    const assets = await this.getAssets(characterId);

    // Filter for ships (category IDs would need to be checked)
    // For now, return high-value items (ships typically have high typeIds)
    return assets.filter(asset => 
      asset.isSingleton && // Ships and unique items
      asset.typeName && 
      !asset.typeName.includes('Capsule')
    );
  }

  /**
   * Refresh assets data
   */
  async refresh(characterId: number): Promise<void> {
    this.log(`Refreshing assets data for character ${characterId}`);
    
    await this.invalidateCache(`char:${characterId}:assets`);
    
    // Force fresh fetch
    await this.getAssets(characterId);
  }

  /**
   * Get asset statistics
   */
  async getStatistics(characterId: number): Promise<any> {
    const assets = await this.getAssets(characterId);
    
    const ships = assets.filter(a => a.isSingleton && a.typeName && !a.typeName.includes('Capsule'));
    const modules = assets.filter(a => !a.isSingleton);
    
    return {
      total: assets.length,
      ships: ships.length,
      modules: modules.length,
      blueprints: assets.filter(a => a.isBlueprintCopy).length,
      totalQuantity: assets.reduce((sum, a) => sum + a.quantity, 0)
    };
  }
}

export const assetsAdapter = new AssetsAdapter();
