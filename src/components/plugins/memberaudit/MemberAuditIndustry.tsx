import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIndustryJobs } from '@/hooks/useIndustryJobs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Factory, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface MemberAuditIndustryProps {
  characterId: number | null;
}

export const MemberAuditIndustry = ({ characterId }: MemberAuditIndustryProps) => {
  const { jobs, loading, error, fetchJobs, getActiveJobs, getTotalCost } = useIndustryJobs(characterId || undefined, {
    enabled: !!characterId,
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

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

  const handleRefresh = async () => {
    await fetchJobs();
    setLastSynced(new Date());
  };

  const activeJobs = getActiveJobs();
  const totalCost = getTotalCost();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Industry Jobs
            </CardTitle>
            <CardDescription>
              {jobs.length} total • {activeJobs.length} active • {totalCost.toLocaleString()} ISK cost
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
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p className="font-medium">Failed to load industry jobs</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No industry jobs yet</p>
            <p className="text-sm text-muted-foreground mt-1">Industry jobs will appear here once synced</p>
          </div>
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
