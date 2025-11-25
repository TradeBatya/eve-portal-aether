import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIndustryJobs } from '@/hooks/useIndustryJobs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Factory, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberAuditIndustryProps {
  characterId: number | null;
}

export const MemberAuditIndustry = ({ characterId }: MemberAuditIndustryProps) => {
  const { jobs, loading, error, fetchJobs, getActiveJobs, getJobsByActivity, getTotalCost } = useIndustryJobs(
    characterId || undefined,
    { enabled: !!characterId, autoRefresh: true, refreshInterval: 300000 }
  );

  const [lastSynced, setLastSynced] = useState<Date>(new Date());

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

  if (!characterId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No character selected</p>
        </CardContent>
      </Card>
    );
  }

  const activeJobs = getActiveJobs();
  const jobsByActivity = getJobsByActivity();
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
              {jobs.length} jobs • {activeJobs.length} active • {totalCost.toLocaleString()} ISK invested
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
            <p className="text-destructive mb-2">Failed to load industry jobs</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No industry jobs found</p>
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
