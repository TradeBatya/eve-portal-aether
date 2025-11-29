import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAssets } from '@/hooks/useAssets';
import { useQuery } from '@tanstack/react-query';
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
}

export const AssetManager = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLocations, setExpandedLocations] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch main character
  const { data: mainCharacter } = useQuery({
    queryKey: ['main-character', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('eve_characters')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_main', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (mainCharacter) {
      setSelectedCharacter(mainCharacter);
    }
  }, [mainCharacter]);

  // Use new assets hook with ESI adapters
  const { assets: assetsData, summary, loading: isLoading, error: assetsError, fetchAssets } = useAssets(
    selectedCharacter?.character_id,
    { enabled: !!selectedCharacter?.character_id }
  );

  // Group assets by location
  const locationGroups = useMemo(() => {
    if (!assetsData) return [];

    const groups = new Map<number, LocationGroup>();

    assetsData.forEach((asset) => {
      if (!groups.has(asset.locationId)) {
        groups.set(asset.locationId, {
          location_id: asset.locationId,
          location_name: asset.locationName || `Location ${asset.locationId}`,
          location_type: asset.locationType || 'unknown',
          assets: [{
            item_id: asset.itemId,
            location_id: asset.locationId,
            type_id: asset.typeId,
            quantity: asset.quantity,
            is_singleton: asset.isSingleton,
          }],
          total_items: asset.quantity,
        });
      } else {
        const group = groups.get(asset.locationId)!;
        group.assets.push({
          item_id: asset.itemId,
          location_id: asset.locationId,
          type_id: asset.typeId,
          quantity: asset.quantity,
          is_singleton: asset.isSingleton,
        });
        group.total_items += asset.quantity;
      }
    });

    return Array.from(groups.values()).sort((a, b) => 
      a.location_name.localeCompare(b.location_name)
    );
  }, [assetsData]);

  // Filter locations by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return locationGroups;
    
    const query = searchQuery.toLowerCase();
    return locationGroups.filter(group => 
      group.location_name.toLowerCase().includes(query) ||
      group.assets.some(asset => {
        const assetData = assetsData?.find(a => a.itemId === asset.item_id);
        return assetData?.typeName?.toLowerCase().includes(query);
      })
    );
  }, [locationGroups, searchQuery, assetsData]);

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
      await fetchAssets();
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
    if (!assetsData) return;

    const headers = ['Location', 'Item', 'Quantity', 'Type'];
    const rows = assetsData.map((asset) => {
      const location = asset.locationName || `Location ${asset.locationId}`;
      const item = asset.typeName || asset.typeId;
      return [location, item, asset.quantity, asset.isSingleton ? 'Single' : 'Stack'];
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
                          const assetData = assetsData?.find(a => a.itemId === asset.item_id);
                          const typeName = assetData?.typeName || `Type ${asset.type_id}`;
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
