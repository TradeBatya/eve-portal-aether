import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface MemberAuditLoyaltyProps {
  characterId: number | null;
}

export const MemberAuditLoyalty = ({ characterId }: MemberAuditLoyaltyProps) => {
  const { loyaltyPoints, loading, error, fetchLoyalty, getTotalLP, getTopCorporations } = useLoyaltyPoints(characterId || undefined, {
    enabled: !!characterId,
    autoRefresh: true,
    refreshInterval: 3600000, // 1 hour
  });
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  if (!characterId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No character selected</p>
        </CardContent>
      </Card>
    );
  }

  const handleRefresh = async () => {
    await fetchLoyalty();
    setLastSynced(new Date());
  };

  const totalLP = getTotalLP();
  const topCorps = getTopCorporations(5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Loyalty Points
            </CardTitle>
            <CardDescription>
              {loyaltyPoints.length} corporations • Total: {totalLP.toLocaleString()} LP
              {lastSynced && (
                <span className="ml-2 text-xs text-muted-foreground">
                  • Last synced {formatDistanceToNow(lastSynced, { addSuffix: true })}
                </span>
              )}
            </CardDescription>
          </div>
          <RefreshCw 
            className={`h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground transition-colors ${loading ? 'animate-spin' : ''}`}
            onClick={handleRefresh}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p className="font-medium">Failed to load loyalty points</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : loyaltyPoints.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No loyalty points yet</p>
            <p className="text-sm text-muted-foreground mt-1">Loyalty points will appear here once synced</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corporation</TableHead>
                <TableHead className="text-right">Loyalty Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loyaltyPoints.map((lp) => (
                <TableRow key={lp.id}>
                  <TableCell className="font-medium">{lp.corporation_name}</TableCell>
                  <TableCell className="text-right font-mono text-lg">
                    {lp.loyalty_points.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
