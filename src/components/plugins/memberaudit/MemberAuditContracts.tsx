import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberAuditContracts } from '@/hooks/useMemberAudit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MemberAuditContractsProps {
  characterId: number | null;
}

export const MemberAuditContracts = ({ characterId }: MemberAuditContractsProps) => {
  const { data: contracts = [], isLoading } = useMemberAuditContracts(characterId || undefined);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Contracts
        </CardTitle>
        <CardDescription>{contracts.length} contracts</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : contracts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No contracts</p>
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
