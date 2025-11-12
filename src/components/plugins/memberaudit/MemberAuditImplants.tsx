import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberAuditImplants, useMemberAuditClones } from '@/hooks/useMemberAudit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, Users2 } from 'lucide-react';

interface MemberAuditImplantsProps {
  characterId: number | null;
}

export const MemberAuditImplants = ({ characterId }: MemberAuditImplantsProps) => {
  const { data: implants = [], isLoading: loadingImplants } = useMemberAuditImplants(characterId || undefined);
  const { data: clones = [], isLoading: loadingClones } = useMemberAuditClones(characterId || undefined);

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
    <Tabs defaultValue="implants">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="implants">
          <Brain className="h-4 w-4 mr-2" />
          Current Implants
        </TabsTrigger>
        <TabsTrigger value="clones">
          <Users2 className="h-4 w-4 mr-2" />
          Jump Clones
        </TabsTrigger>
      </TabsList>

      <TabsContent value="implants" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Implants</CardTitle>
            <CardDescription>{implants.length} implants installed</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingImplants ? (
              <p className="text-muted-foreground text-center py-4">Loading...</p>
            ) : implants.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No implants installed</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slot</TableHead>
                    <TableHead>Implant</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {implants.map((implant) => (
                    <TableRow key={implant.id}>
                      <TableCell>
                        <Badge>Slot {implant.slot}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{implant.implant_name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {implant.implant_id}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="clones" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Jump Clones</CardTitle>
            <CardDescription>{clones.length} clones available</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingClones ? (
              <p className="text-muted-foreground text-center py-4">Loading...</p>
            ) : clones.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No jump clones</p>
            ) : (
              <div className="space-y-4">
                {clones.map((clone) => (
                  <Card key={clone.id}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {clone.clone_name || `Clone #${clone.jump_clone_id}`}
                      </CardTitle>
                      <CardDescription>
                        {clone.location_name || 'Unknown Location'}
                        {' • '}
                        <Badge variant="outline" className="ml-2">
                          {clone.location_type}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(clone.implants) && clone.implants.length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Implants:</p>
                          <div className="flex flex-wrap gap-2">
                            {clone.implants.map((implantId: number, idx: number) => (
                              <Badge key={idx} variant="secondary">
                                Implant {implantId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No implants</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
