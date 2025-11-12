import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberAuditWalletJournal, useMemberAuditWalletTransactions } from '@/hooks/useMemberAudit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Receipt, ShoppingCart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MemberAuditWalletProps {
  characterId: number | null;
}

export const MemberAuditWallet = ({ characterId }: MemberAuditWalletProps) => {
  const { data: journal = [], isLoading: loadingJournal } = useMemberAuditWalletJournal(characterId || undefined);
  const { data: transactions = [], isLoading: loadingTx } = useMemberAuditWalletTransactions(characterId || undefined);

  if (!characterId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No character selected</p>
        </CardContent>
      </Card>
    );
  }

  const formatISK = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <Tabs defaultValue="journal">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="journal">
          <Receipt className="h-4 w-4 mr-2" />
          Journal
        </TabsTrigger>
        <TabsTrigger value="transactions">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Transactions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="journal" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Journal</CardTitle>
            <CardDescription>{journal.length} recent entries</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingJournal ? (
              <p className="text-muted-foreground text-center py-4">Loading...</p>
            ) : journal.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No journal entries</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journal.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.ref_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1">
                          {entry.first_party_name && (
                            <div className="text-muted-foreground">From: {entry.first_party_name}</div>
                          )}
                          {entry.second_party_name && (
                            <div className="text-muted-foreground">To: {entry.second_party_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {entry.amount >= 0 ? <TrendingUp className="h-4 w-4 inline mr-1" /> : <TrendingDown className="h-4 w-4 inline mr-1" />}
                          {formatISK(entry.amount)} ISK
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {entry.balance?.toLocaleString()} ISK
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transactions" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Market Transactions</CardTitle>
            <CardDescription>{transactions.length} recent transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTx ? (
              <p className="text-muted-foreground text-center py-4">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No transactions</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(tx.date), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.is_buy ? 'default' : 'secondary'}>
                          {tx.is_buy ? 'Buy' : 'Sell'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{tx.type_name}</TableCell>
                      <TableCell className="text-right">{tx.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">
                        {tx.unit_price.toLocaleString()} ISK
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {(tx.quantity * tx.unit_price).toLocaleString()} ISK
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
