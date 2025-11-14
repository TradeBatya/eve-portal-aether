import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Coins, Package, Calendar, MapPin, Ship, RefreshCw, AlertCircle } from 'lucide-react';
import { MemberAuditMetadata } from '@/types/memberaudit';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { esiService } from '@/services/esiService';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberAuditOverviewProps {
  characterId: number | null;
  character?: any;
  metadata?: MemberAuditMetadata | null;
}

export const MemberAuditOverview = ({ characterId, character, metadata }: MemberAuditOverviewProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

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
      await esiService.refreshCharacterData(characterId);
      await queryClient.invalidateQueries({ queryKey: ['member-audit-metadata'] });
      toast({
        title: 'Success',
        description: 'Character data refreshed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh character data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const cacheStatus = metadata?.last_update_at 
    ? esiService.getCacheStatus(metadata.last_update_at)
    : { isStale: true, ageMinutes: Infinity };

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
                {cacheStatus.isStale && (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
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
              disabled={isRefreshing}
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
                {metadata?.security_status !== undefined && metadata?.security_status !== null
                  ? metadata.security_status.toFixed(2)
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span className="ml-2 font-medium">
                {!metadata?.location_name ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  metadata.location_name
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Ship className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Ship:</span>
              <span className="ml-2 font-medium">
                {!metadata?.ship_type_name ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  metadata.ship_type_name
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Sync:</span>
              <span className={`ml-2 font-medium ${cacheStatus.isStale ? 'text-yellow-500' : 'text-green-500'}`}>
                {metadata?.last_update_at 
                  ? formatDistanceToNow(new Date(metadata.last_update_at), { addSuffix: true })
                  : 'Never'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SP</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metadata?.total_sp || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(metadata?.unallocated_sp || 0)} unallocated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatISK(metadata?.wallet_balance || 0)}</div>
            <p className="text-xs text-muted-foreground">Available funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assets Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatISK(metadata?.total_assets_value || 0)}</div>
            <p className="text-xs text-muted-foreground">Estimated total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {metadata?.sync_status || 'Pending'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metadata?.last_update_at 
                ? formatDistanceToNow(new Date(metadata.last_update_at), { addSuffix: true })
                : 'Never synced'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Progress */}
      {metadata?.sync_progress && Object.keys(metadata.sync_progress).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Module Status</CardTitle>
            <CardDescription>Last sync progress by module</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(metadata.sync_progress).map(([module, progress]) => (
                <div key={module} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{module}</span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
