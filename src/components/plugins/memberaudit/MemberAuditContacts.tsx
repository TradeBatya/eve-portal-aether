import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useContacts } from '@/hooks/useContacts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberAuditContactsProps {
  characterId: number | null;
}

export const MemberAuditContacts = ({ characterId }: MemberAuditContactsProps) => {
  const { contacts, loading, error, fetchContacts, searchContacts, getContactsByType } = useContacts(
    characterId || undefined,
    { enabled: !!characterId, autoRefresh: true, refreshInterval: 3600000 }
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  const contactTypes = useMemo(() => {
    const types = new Set(contacts.map(c => c.contact_type));
    return ['all', ...Array.from(types)];
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    let result = searchQuery ? searchContacts(searchQuery) : contacts;
    if (selectedType !== 'all') {
      result = getContactsByType(selectedType);
    }
    return result;
  }, [contacts, searchQuery, selectedType, searchContacts, getContactsByType]);

  const getStandingColor = (standing: number): string => {
    if (standing >= 5) return 'text-blue-500';
    if (standing > 0) return 'text-green-500';
    if (standing === 0) return 'text-muted-foreground';
    if (standing > -5) return 'text-orange-500';
    return 'text-destructive';
  };

  const getStandingLabel = (standing: number): string => {
    if (standing >= 10) return 'Excellent';
    if (standing >= 5) return 'Good';
    if (standing > 0) return 'Neutral+';
    if (standing === 0) return 'Neutral';
    if (standing > -5) return 'Bad';
    if (standing > -10) return 'Terrible';
    return 'Hostile';
  };

  const handleRefresh = async () => {
    await fetchContacts();
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contacts
            </CardTitle>
            <CardDescription>
              {filteredContacts.length} contacts
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
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {contactTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <p className="text-destructive mb-2">Failed to load contacts</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {searchQuery || selectedType !== 'all' 
                ? 'No contacts found matching your filters' 
                : 'No contacts yet'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Standing</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.contact_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {contact.contact_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono ${getStandingColor(contact.standing)}`}>
                        {contact.standing.toFixed(1)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {getStandingLabel(contact.standing)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {contact.is_watched && (
                        <Badge variant="default" className="text-xs">Watched</Badge>
                      )}
                      {contact.is_blocked && (
                        <Badge variant="destructive" className="text-xs">Blocked</Badge>
                      )}
                    </div>
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
