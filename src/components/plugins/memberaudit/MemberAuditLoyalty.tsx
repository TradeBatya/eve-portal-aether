import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberAuditLoyaltyProps {
  characterId: number | null;
}

export const MemberAuditLoyalty = ({ characterId }: MemberAuditLoyaltyProps) => {
  const { loyaltyPoints, loading, error, fetchLoyalty, getTotalLP, getTopCorporations } = useLoyaltyPoints(
    characterId || undefined,
    { enabled: !!characterId, autoRefresh: true, refreshInterval: 3600000 }
  );

  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  const handleRefresh = async () => {
    await fetchLoyalty();
    setLastSynced(new Date());
  };

  if (!characterId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No character selected</p>
        </CardContent>
      </Card>
    );
  }

  const totalLP = getTotalLP();
  const topCorporations = getTopCorporations();

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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-2">Failed to load loyalty points</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : loyaltyPoints.length === 0 ? (
          <div className="text-center py-8">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No loyalty points found</p>
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
