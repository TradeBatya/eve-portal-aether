import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useContracts } from '@/hooks/useContracts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface MemberAuditContractsProps {
  characterId: number | null;
}

export const MemberAuditContracts = ({ characterId }: MemberAuditContractsProps) => {
  const { contracts, loading, error, fetchContracts, getActiveContracts, getContractValue } = useContracts(characterId || undefined, {
    enabled: !!characterId,
    autoRefresh: true,
    refreshInterval: 900000, // 15 minutes
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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'finished': return 'default';
      case 'in_progress': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const handleRefresh = async () => {
    await fetchContracts();
    setLastSynced(new Date());
  };

  const activeContracts = getActiveContracts();
  const totalValue = getContractValue();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contracts
            </CardTitle>
            <CardDescription>
              {contracts.length} total • {activeContracts.length} active • {totalValue.toLocaleString()} ISK value
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
            <p className="font-medium">Failed to load contracts</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No contracts yet</p>
            <p className="text-sm text-muted-foreground mt-1">Contracts will appear here once synced</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issuer</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.title || `Contract #${contract.contract_id}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {contract.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(contract.status)} className="capitalize">
                      {contract.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {contract.issuer_name || `ID: ${contract.issuer_id}`}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {contract.price?.toLocaleString() || '0'} ISK
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(contract.date_issued), { addSuffix: true })}
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
