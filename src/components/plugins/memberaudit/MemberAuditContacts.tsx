import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useContacts } from '@/hooks/useContacts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Eye, Ban, Search, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MemberAuditContactsProps {
  characterId: number | null;
}

export const MemberAuditContacts = ({ characterId }: MemberAuditContactsProps) => {
  const { contacts, loading, error, fetchContacts, searchContacts, getContactsByType } = useContacts(characterId || undefined, {
    enabled: !!characterId,
    autoRefresh: true,
    refreshInterval: 3600000, // 1 hour
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  // Get unique contact types
  const contactTypes = useMemo(() => {
    const types = new Set(contacts.map(c => c.contact_type));
    return Array.from(types).sort();
  }, [contacts]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    let filtered = contacts;
    
    if (searchQuery) {
      filtered = searchContacts(searchQuery);
    }
    
    if (selectedType !== 'all') {
      filtered = getContactsByType(selectedType);
    }
    
    return filtered;
  }, [contacts, searchQuery, selectedType, searchContacts, getContactsByType]);

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

  const getStandingColor = (standing: number) => {
    if (standing >= 5) return 'text-blue-600';
    if (standing > 0) return 'text-green-600';
    if (standing === 0) return 'text-muted-foreground';
    if (standing >= -5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStandingLabel = (standing: number) => {
    if (standing >= 5) return 'Excellent';
    if (standing > 0) return 'Good';
    if (standing === 0) return 'Neutral';
    if (standing >= -5) return 'Bad';
    return 'Terrible';
  };

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
              {filteredContacts.length} of {contacts.length} contacts
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
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {contactTypes.map(type => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p className="font-medium">Failed to load contacts</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">
              {searchQuery || selectedType !== 'all' ? 'No contacts match your filters' : 'No contacts yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || selectedType !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Contacts will appear here once synced'}
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
                      <span className={`font-mono font-semibold ${getStandingColor(contact.standing)}`}>
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
                        <Badge variant="outline" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Watched
                        </Badge>
                      )}
                      {contact.is_blocked && (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          Blocked
                        </Badge>
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
