import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberAuditIndustryJobs } from '@/hooks/useMemberAudit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Factory } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MemberAuditIndustryProps {
  characterId: number | null;
}

export const MemberAuditIndustry = ({ characterId }: MemberAuditIndustryProps) => {
  const { data: jobs = [], isLoading } = useMemberAuditIndustryJobs(characterId || undefined);

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
      case 'active': return 'default';
      case 'ready': return 'secondary';
      case 'delivered': return 'outline';
      default: return 'destructive';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="h-5 w-5" />
          Industry Jobs
        </CardTitle>
        <CardDescription>{jobs.length} jobs</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : jobs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No industry jobs</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blueprint</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.blueprint_type_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.activity_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(job.status)} className="capitalize">
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{job.runs}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {job.solar_system_name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {job.status === 'active' 
                      ? formatDistanceToNow(new Date(job.end_date), { addSuffix: true })
                      : new Date(job.end_date).toLocaleDateString()}
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
