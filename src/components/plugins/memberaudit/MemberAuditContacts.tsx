import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberAuditContacts } from '@/hooks/useMemberAudit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Eye, Ban, Search } from 'lucide-react';

interface MemberAuditContactsProps {
  characterId: number | null;
}

export const MemberAuditContacts = ({ characterId }: MemberAuditContactsProps) => {
  const { data: contacts = [], isLoading } = useMemberAuditContacts(characterId || undefined);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Get unique contact types
  const contactTypes = useMemo(() => {
    const types = new Set(contacts.map(c => c.contact_type));
    return Array.from(types).sort();
  }, [contacts]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = contact.contact_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || contact.contact_type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [contacts, searchQuery, selectedType]);

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
            <CardDescription>{filteredContacts.length} of {contacts.length} contacts</CardDescription>
          </div>
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
        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : filteredContacts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {searchQuery || selectedType !== 'all' ? 'No contacts match your filters' : 'No contacts'}
          </p>
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
