import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Package, MapPin, Box, Coins } from 'lucide-react';

interface AssetMetrics {
  total_items: number;
  unique_types: number;
  locations_count: number;
  total_value?: number; // Phase 8: Add total value
}

export function AssetsCard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [metrics, setMetrics] = useState<AssetMetrics>({
    total_items: 0,
    unique_types: 0,
    locations_count: 0,
    total_value: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssetMetrics();
    }
  }, [user]);

  const fetchAssetMetrics = async () => {
    try {
      setLoading(true);
      
      // Try to get from member_audit_metadata first (more reliable)
      const { data: characters } = await supabase
        .from('eve_characters')
        .select('character_id')
        .eq('user_id', user?.id)
        .eq('is_main', true)
        .single();

      if (characters?.character_id) {
        const { data: metadata } = await supabase
          .from('member_audit_metadata')
          .select('total_assets_value')
          .eq('character_id', characters.character_id)
          .single();

        const { data: assets } = await supabase
          .from('member_audit_assets')
          .select('type_id, location_id, quantity')
          .eq('character_id', characters.character_id);

        if (assets && assets.length > 0) {
          const totalItems = assets.reduce((sum, asset) => sum + (asset.quantity || 0), 0);
          const uniqueTypes = new Set(assets.map(a => a.type_id)).size;
          const locationsCount = new Set(assets.map(a => a.location_id)).size;

          setMetrics({
            total_items: totalItems,
            unique_types: uniqueTypes,
            locations_count: locationsCount,
            total_value: metadata?.total_assets_value || 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch asset metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const t = {
    en: {
      title: 'Assets',
      total: 'Total Items',
      types: 'Unique Types',
      locations: 'Locations',
      value: 'Est. Value',
      diversification: 'Diversification',
      risk: 'Concentration Risk',
      good: 'Good',
      low: 'Low',
      loading: 'Loading...'
    },
    ru: {
      title: 'Активы',
      total: 'Всего предметов',
      types: 'Уникальных типов',
      locations: 'Локаций',
      value: 'Оценка стоимости',
      diversification: 'Диверсификация',
      risk: 'Риск концентрации',
      good: 'Хорошая',
      low: 'Низкий',
      loading: 'Загрузка...'
    }
  }[language];

  const formatISK = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
    return value.toFixed(0);
  };

  // Calculate qualitative indicators
  const diversification = metrics.locations_count >= 10 ? t.good : 
    metrics.locations_count >= 5 ? 'Medium' : 'Low';
  const riskLevel = metrics.locations_count >= 10 ? t.low :
    metrics.locations_count >= 5 ? 'Medium' : 'High';

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t.loading}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{t.title}</h3>
      </div>

      <div className="space-y-4">
        {/* Practical Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t.total}</span>
            </div>
            <span className="text-lg font-bold">{metrics.total_items.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t.types}</span>
            </div>
            <span className="text-lg font-bold">{metrics.unique_types}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t.locations}</span>
            </div>
            <span className="text-lg font-bold">{metrics.locations_count}</span>
          </div>

          {/* Phase 8: Display estimated value */}
          {metrics.total_value !== undefined && metrics.total_value > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t.value}</span>
              </div>
              <span className="text-lg font-bold">~{formatISK(metrics.total_value)} ISK</span>
            </div>
          )}
        </div>

        {/* Qualitative Indicators */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t.diversification}:</span>
            <span className={`font-medium ${
              diversification === t.good ? 'text-green-500' : 
              diversification === 'Medium' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {diversification}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t.risk}:</span>
            <span className={`font-medium ${
              riskLevel === t.low ? 'text-green-500' :
              riskLevel === 'Medium' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {riskLevel}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
