import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { esiMonitor } from '@/services/esi/EsiMonitor';
import type { EsiMetrics, TokenHealth, EndpointStats } from '@/services/esi/EsiMonitor';
import { Activity, AlertCircle, CheckCircle, Clock, Database, RefreshCw, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export const EsiMonitorDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<EsiMetrics | null>(null);
  const [tokenHealth, setTokenHealth] = useState<TokenHealth[]>([]);
  const [endpointStats, setEndpointStats] = useState<EndpointStats[]>([]);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const [metricsData, healthData, statsData, errorsData, cacheData] = await Promise.all([
        esiMonitor.getMetrics(),
        esiMonitor.getTokenHealth(),
        esiMonitor.getEndpointStats(10),
        esiMonitor.getRecentErrors(10),
        esiMonitor.getCacheStats()
      ]);

      setMetrics(metricsData);
      setTokenHealth(healthData);
      setEndpointStats(statsData);
      setRecentErrors(errorsData);
      setCacheStats(cacheData);
    } catch (error) {
      console.error('Failed to fetch monitor data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchData();
      }, 30000); // 30 секунд

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const successRate = metrics
    ? ((metrics.requestsSuccess / metrics.requestsTotal) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ESI Monitor</h1>
          <p className="text-muted-foreground">Real-time ESI service health and performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button onClick={fetchData} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.requestsTotal || 0}</div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <Progress value={Number(successRate)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.cacheHitRate.toFixed(1) || 0}%
            </div>
            <Progress value={metrics?.cacheHitRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageResponseTime || 0}ms</div>
            <p className="text-xs text-muted-foreground">Average latency</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tokens" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tokens">Token Health</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="errors">Recent Errors</TabsTrigger>
          <TabsTrigger value="cache">Cache Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Health Status</CardTitle>
              <CardDescription>
                Monitor token expiration and health across all characters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tokenHealth.map((token) => (
                  <div
                    key={token.characterId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Character {token.characterId}</span>
                        {token.isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : token.expiresIn < 600000 ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-500">
                            Expiring Soon
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-500">
                            Healthy
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {token.isExpired
                          ? 'Token expired'
                          : `Expires in ${formatDuration(token.expiresIn)}`}
                      </p>
                      {token.validationFailures > 0 && (
                        <p className="text-sm text-destructive">
                          {token.validationFailures} validation failures
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {token.scopes.length} scopes
                    </div>
                  </div>
                ))}
                {tokenHealth.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No tokens found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Performance</CardTitle>
              <CardDescription>Top 10 most used endpoints and their stats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endpointStats.map((stat) => (
                  <div key={stat.endpoint} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono truncate max-w-md">
                        {stat.endpoint}
                      </span>
                      <Badge variant="outline">{stat.totalRequests} requests</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Success: {stat.successRate.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">
                        Avg: {stat.averageResponseTime}ms
                      </span>
                    </div>
                    {stat.lastError && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {stat.lastError}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>Last 10 ESI request errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentErrors.map((error, idx) => (
                  <Alert key={idx} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">{error.endpoint}</p>
                        <p className="text-sm">{error.error_message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(error.accessed_at).toLocaleString()}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
                {recentErrors.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No recent errors</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Statistics</CardTitle>
              <CardDescription>Memory and database cache performance</CardDescription>
            </CardHeader>
            <CardContent>
              {cacheStats && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Memory Cache</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Hits:</span>
                          <span className="font-medium">{cacheStats.memoryHits}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Misses:</span>
                          <span className="font-medium">{cacheStats.memoryMisses}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Hit Rate:</span>
                          <span className="font-medium">{cacheStats.memoryHitRate}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Database Cache</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Hits:</span>
                          <span className="font-medium">{cacheStats.dbHits}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Misses:</span>
                          <span className="font-medium">{cacheStats.dbMisses}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Hit Rate:</span>
                          <span className="font-medium">{cacheStats.dbHitRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
