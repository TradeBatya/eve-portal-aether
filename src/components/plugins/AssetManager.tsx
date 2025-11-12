import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCharacterAssets, useUniverseNames } from '@/hooks/useEsiApi';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { 
  Package, 
  RefreshCw, 
  Search, 
  ChevronRight, 
  ChevronDown,
  MapPin,
  Box,
  Download
} from 'lucide-react';

interface Asset {
  item_id: number;
  location_id: number;
  type_id: number;
  quantity: number;
  location_flag?: string;
  is_singleton?: boolean;
  is_blueprint_copy?: boolean;
}

interface LocationGroup {
  location_id: number;
  location_name: string;
  location_type: string;
  assets: Asset[];
  total_items: number;
  estimated_value?: number;
}

export const AssetManager = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLocations, setExpandedLocations] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch main character
  useEffect(() => {
    const fetchMainCharacter = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('eve_characters')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_main', true)
        .single();
      
      if (data) setSelectedCharacter(data);
    };
    fetchMainCharacter();
  }, [user]);

  // Fetch assets from ESI
  const { data: assetsData, isLoading, refetch } = useCharacterAssets(
    selectedCharacter?.character_id,
    selectedCharacter?.access_token
  );

  // Get unique location and type IDs for name resolution
  const locationIds = useMemo(() => {
    if (!assetsData) return [];
    // Filter out structure IDs (>= 1000000000000) as they can't be resolved via /universe/names/
    const allIds = [...new Set(assetsData.map((a: Asset) => a.location_id))];
    const validIds = allIds.filter((id): id is number => typeof id === 'number' && id < 1000000000000);
    return validIds;
  }, [assetsData]);

  const typeIds = useMemo(() => {
    if (!assetsData) return [];
    return [...new Set(assetsData.map((a: Asset) => a.type_id))] as number[];
  }, [assetsData]);

  const { data: locationNames } = useUniverseNames(locationIds);
  const { data: typeNames } = useUniverseNames(typeIds);

  // Group assets by location
  const locationGroups = useMemo(() => {
    if (!assetsData) return [];

    // Helper to get location name with fallback for structures
    const getLocationName = (locationId: number) => {
      if (locationId >= 1000000000000) {
        return `Structure ${locationId}`;
      }
      return locationNames?.find((n: any) => n.id === locationId)?.name || `Location ${locationId}`;
    };

    const getLocationType = (locationId: number): string => {
      if (locationId >= 60000000 && locationId < 64000000) return 'station';
      if (locationId >= 1000000000000) return 'structure';
      return 'space';
    };

    const groups = new Map<number, LocationGroup>();

    assetsData.forEach((asset: Asset) => {
      const locationName = getLocationName(asset.location_id);
      
      if (!groups.has(asset.location_id)) {
        groups.set(asset.location_id, {
          location_id: asset.location_id,
          location_name: locationName,
          location_type: getLocationType(asset.location_id),
          assets: [],
          total_items: 0,
          estimated_value: 0,
        });
      }

      const group = groups.get(asset.location_id)!;
      group.assets.push(asset);
      group.total_items += asset.quantity;
    });

    return Array.from(groups.values()).sort((a, b) => 
      a.location_name.localeCompare(b.location_name)
    );
  }, [assetsData, locationNames]);

  // Filter locations by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return locationGroups;
    
    const query = searchQuery.toLowerCase();
    return locationGroups.filter(group => 
      group.location_name.toLowerCase().includes(query) ||
      group.assets.some(asset => {
        const typeName = typeNames?.find((n: any) => n.id === asset.type_id)?.name || '';
        return typeName.toLowerCase().includes(query);
      })
    );
  }, [locationGroups, searchQuery, typeNames]);

  const toggleLocation = (locationId: number) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    setExpandedLocations(newExpanded);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: language === 'en' ? 'Assets Updated' : 'Активы обновлены',
        description: language === 'en' 
          ? 'Asset data has been refreshed from ESI' 
          : 'Данные об активах обновлены из ESI',
      });
    } catch (error) {
      toast({
        title: language === 'en' ? 'Error' : 'Ошибка',
        description: language === 'en' 
          ? 'Failed to refresh assets' 
          : 'Не удалось обновить активы',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportToCSV = () => {
    if (!assetsData || !typeNames) return;

    const headers = ['Location', 'Item', 'Quantity', 'Type'];
    const rows = assetsData.map((asset: Asset) => {
      // Get location name with structure fallback
      const location = asset.location_id >= 1000000000000 
        ? `Structure ${asset.location_id}`
        : (locationNames?.find((n: any) => n.id === asset.location_id)?.name || `Location ${asset.location_id}`);
      const item = typeNames?.find((n: any) => n.id === asset.type_id)?.name || asset.type_id;
      return [location, item, asset.quantity, asset.is_singleton ? 'Single' : 'Stack'];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assets_${selectedCharacter?.character_name}_${new Date().toISOString()}.csv`;
    a.click();
  };

  const totalAssets = useMemo(() => 
    locationGroups.reduce((sum, group) => sum + group.total_items, 0),
    [locationGroups]
  );

  if (!selectedCharacter) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {language === 'en' ? 'Asset Manager' : 'Менеджер активов'}
          </CardTitle>
          <CardDescription>
            {language === 'en' 
              ? 'No main character selected' 
              : 'Не выбран основной персонаж'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {language === 'en' ? 'Asset Manager' : 'Менеджер активов'}
            </CardTitle>
            <CardDescription>
              {selectedCharacter.character_name} • {locationGroups.length} {language === 'en' ? 'locations' : 'локаций'} • {totalAssets.toLocaleString()} {language === 'en' ? 'items' : 'предметов'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={!assetsData || assetsData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Export' : 'Экспорт'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {language === 'en' ? 'Refresh' : 'Обновить'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'en' ? 'Search assets...' : 'Поиск активов...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {/* Location tree */}
          {!isLoading && filteredGroups.length > 0 && (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredGroups.map(group => (
                  <div key={group.location_id} className="border rounded-lg">
                    {/* Location header */}
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => toggleLocation(group.location_id)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedLocations.has(group.location_id) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <MapPin className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium">{group.location_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {group.total_items.toLocaleString()} {language === 'en' ? 'items' : 'предметов'}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {group.location_type}
                      </Badge>
                    </div>

                    {/* Assets list */}
                    {expandedLocations.has(group.location_id) && (
                      <div className="border-t bg-muted/30">
                        {group.assets.map((asset, idx) => {
                          const typeName = typeNames?.find((n: any) => n.id === asset.type_id)?.name || `Type ${asset.type_id}`;
                          return (
                            <div
                              key={`${asset.item_id}-${idx}`}
                              className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-accent/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Box className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-sm">{typeName}</div>
                                  {asset.location_flag && (
                                    <div className="text-xs text-muted-foreground">
                                      {asset.location_flag}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {asset.is_blueprint_copy && (
                                  <Badge variant="outline" className="text-xs">BPC</Badge>
                                )}
                                <div className="text-sm font-medium">
                                  {asset.quantity.toLocaleString()}x
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Empty state */}
          {!isLoading && filteredGroups.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>
                {searchQuery 
                  ? (language === 'en' ? 'No assets found' : 'Активы не найдены')
                  : (language === 'en' ? 'No assets to display' : 'Нет активов для отображения')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
