import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Coins, Package, MapPin, Ship, RefreshCw, AlertCircle, Zap, Wallet } from 'lucide-react';
import { MemberAuditMetadata } from '@/types/memberaudit';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCharacterService } from '@/hooks/useEsiService';
import { memberAuditAdapter } from '@/services/esi/adapters/MemberAuditAdapter';

interface MemberAuditOverviewProps {
  characterId: number | null;
  character?: any;
  metadata?: MemberAuditMetadata | null;
}

export const MemberAuditOverview = ({ characterId, character, metadata }: MemberAuditOverviewProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Use new centralized ESI service for live data
  const { data: esiData, loading: esiLoading, error: esiError, refresh: refreshEsiData } = useCharacterService(
    characterId || undefined,
    ['basic', 'location', 'ship', 'skills', 'wallet']
  );

  if (!characterId || !character) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No character selected</p>
        </CardContent>
      </Card>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Use adapter to refresh all data and update database
      await memberAuditAdapter.refreshCharacterData(characterId);
      
      // Refresh queries
      await Promise.all([
        refreshEsiData(),
        queryClient.invalidateQueries({ queryKey: ['member-audit-metadata'] })
      ]);
      
      toast({
        title: 'Success',
        description: 'Character data refreshed successfully',
      });
    } catch (error: any) {
      console.error('Refresh error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to refresh character data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Merge ESI live data with cached metadata
  const displayData = {
    securityStatus: esiData?.basic?.security_status ?? metadata?.security_status,
    location: esiData?.location?.solar_system_name ?? metadata?.solar_system_name ?? 'Unknown',
    locationId: esiData?.location?.solar_system_id ?? metadata?.solar_system_id,
    ship: esiData?.ship?.ship_type_name ?? metadata?.ship_type_name ?? 'Unknown',
    shipName: esiData?.ship?.ship_name ?? metadata?.ship_name,
    totalSp: esiData?.skills?.total_sp ?? metadata?.total_sp ?? 0,
    unallocatedSp: esiData?.skills?.unallocated_sp ?? metadata?.unallocated_sp ?? 0,
    walletBalance: esiData?.wallet ?? metadata?.wallet_balance ?? 0,
    lastUpdate: metadata?.last_update_at,
    syncStatus: metadata?.sync_status ?? 'pending',
    fromCache: !esiData || Object.keys(esiData).length === 0
  };

  const cacheAge = displayData.lastUpdate 
    ? Math.floor((Date.now() - new Date(displayData.lastUpdate).getTime()) / 60000)
    : Infinity;
  const isStale = cacheAge > 5;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatISK = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(2)}B ISK`;
    } else if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(2)}M ISK`;
    } else if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(2)}K ISK`;
    }
    return `${amount.toFixed(2)} ISK`;
  };

  return (
    <div className="space-y-4">
      {/* Character Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {character.character_name}
                {isStale && (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                {esiLoading && (
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                )}
              </CardTitle>
              <CardDescription>
                {character.corporation_name}
                {character.alliance_name && ` • ${character.alliance_name}`}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || esiLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Security Status:</span>
              <span className="ml-2 font-medium">
                {displayData.securityStatus !== undefined && displayData.securityStatus !== null
                  ? displayData.securityStatus.toFixed(2)
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{displayData.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Ship className="h-4 w-4 text-muted-foreground" />
              <span>{displayData.shipName || displayData.ship}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Sync:</span>
              <span className="ml-2 font-medium">
                {displayData.lastUpdate 
                  ? formatDistanceToNow(new Date(displayData.lastUpdate), { addSuffix: true })
                  : 'Never'}
              </span>
            </div>
          </div>

          {esiError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Failed to load live ESI data. Showing cached data.
              </p>
            </div>
          )}

          {displayData.fromCache && !esiError && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Showing cached data from {cacheAge < 60 ? `${cacheAge} minutes` : `${Math.floor(cacheAge / 60)} hours`} ago
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total SP */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SP</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {esiLoading && !displayData.totalSp ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(displayData.totalSp)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(displayData.unallocatedSp)} unallocated
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Wallet Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {esiLoading && !displayData.walletBalance ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatISK(displayData.walletBalance)}</div>
                <p className="text-xs text-muted-foreground">Available funds</p>
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium capitalize">{displayData.syncStatus}</p>
              <p className="text-xs text-muted-foreground">
                {displayData.lastUpdate 
                  ? `Last updated ${formatDistanceToNow(new Date(displayData.lastUpdate), { addSuffix: true })}`
                  : 'Never synced'}
              </p>
            </div>
            {isStale && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Update Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
