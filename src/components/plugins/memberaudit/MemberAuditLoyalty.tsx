import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberAuditLoyaltyPoints } from '@/hooks/useMemberAudit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award } from 'lucide-react';

interface MemberAuditLoyaltyProps {
  characterId: number | null;
}

export const MemberAuditLoyalty = ({ characterId }: MemberAuditLoyaltyProps) => {
  const { data: loyaltyPoints = [], isLoading } = useMemberAuditLoyaltyPoints(characterId || undefined);

  if (!characterId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No character selected</p>
        </CardContent>
      </Card>
    );
  }

  const totalLP = loyaltyPoints.reduce((sum, lp) => sum + lp.loyalty_points, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Loyalty Points
        </CardTitle>
        <CardDescription>
          {loyaltyPoints.length} corporations • Total: {totalLP.toLocaleString()} LP
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : loyaltyPoints.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No loyalty points</p>
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
