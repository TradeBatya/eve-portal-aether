import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberAuditContacts } from '@/hooks/useMemberAudit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, Ban } from 'lucide-react';

interface MemberAuditContactsProps {
  characterId: number | null;
}

export const MemberAuditContacts = ({ characterId }: MemberAuditContactsProps) => {
  const { data: contacts = [], isLoading } = useMemberAuditContacts(characterId || undefined);

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
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Contacts
        </CardTitle>
        <CardDescription>{contacts.length} contacts</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : contacts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No contacts</p>
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
              {contacts.map((contact) => (
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
