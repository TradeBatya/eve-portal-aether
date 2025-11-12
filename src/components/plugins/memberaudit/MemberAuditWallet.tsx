import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberAuditWalletJournal, useMemberAuditWalletTransactions } from '@/hooks/useMemberAudit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Receipt, ShoppingCart, Search, Calendar } from 'lucide-react';
import { formatDistanceToNow, isWithinInterval, subDays } from 'date-fns';

interface MemberAuditWalletProps {
  characterId: number | null;
}

export const MemberAuditWallet = ({ characterId }: MemberAuditWalletProps) => {
  const { data: journal = [], isLoading: loadingJournal } = useMemberAuditWalletJournal(characterId || undefined);
  const { data: transactions = [], isLoading: loadingTx } = useMemberAuditWalletTransactions(characterId || undefined);

  const [transactionType, setTransactionType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Type filter
      if (transactionType === 'buy' && !tx.is_buy) return false;
      if (transactionType === 'sell' && tx.is_buy) return false;

      // Date range filter
      if (dateRange !== 'all') {
        const txDate = new Date(tx.date);
        const now = new Date();
        const days = parseInt(dateRange);
        if (!isWithinInterval(txDate, { start: subDays(now, days), end: now })) {
          return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return tx.type_name.toLowerCase().includes(query) ||
               tx.client_name?.toLowerCase().includes(query) ||
               tx.location_name?.toLowerCase().includes(query);
      }

      return true;
    });
  }, [transactions, transactionType, dateRange, searchQuery]);

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
            <div>
              <CardTitle>Market Transactions</CardTitle>
              <CardDescription>{filteredTransactions.length} of {transactions.length} transactions</CardDescription>
            </div>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTx ? (
              <p className="text-muted-foreground text-center py-4">Loading...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {searchQuery || transactionType !== 'all' || dateRange !== 'all' 
                  ? 'No transactions match your filters' 
                  : 'No transactions'}
              </p>
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
                  {filteredTransactions.map((tx) => (
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
