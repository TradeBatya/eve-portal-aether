import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const ESI_BASE_URL = 'https://esi.evetech.net/latest';

interface EsiStatusData {
  status: 'online' | 'offline' | 'checking';
  responseTime: number | null;
  lastCheck: Date | null;
  version: string | null;
  endpoints: {
    name: string;
    status: 'ok' | 'error' | 'checking';
    responseTime: number | null;
  }[];
}

export function EsiStatus() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [data, setData] = useState<EsiStatusData>({
    status: 'checking',
    responseTime: null,
    lastCheck: null,
    version: null,
    endpoints: [
      { name: 'Status', status: 'checking', responseTime: null },
      { name: 'Universe', status: 'checking', responseTime: null },
      { name: 'Characters', status: 'checking', responseTime: null },
    ],
  });
  const [checking, setChecking] = useState(false);

  const checkESI = async () => {
    setChecking(true);
    const startTime = Date.now();
    
    try {
      // Check main status endpoint
      const statusResponse = await fetch(`${ESI_BASE_URL}/status/`, {
        signal: AbortSignal.timeout(10000),
      });
      
      const mainResponseTime = Date.now() - startTime;
      
      if (!statusResponse.ok) {
        throw new Error('ESI is offline');
      }

      const statusData = await statusResponse.json();
      
      // Check individual endpoints
      const endpointChecks = [
        { name: 'Status', url: `${ESI_BASE_URL}/status/` },
        { name: 'Universe', url: `${ESI_BASE_URL}/universe/systems/30000142/` }, // Jita system
        { name: 'Markets', url: `${ESI_BASE_URL}/markets/10000002/orders/?datasource=tranquility&order_type=all&page=1&type_id=34` }, // The Forge region
      ];

      const endpointResults = await Promise.allSettled(
        endpointChecks.map(async ({ name, url }) => {
          const start = Date.now();
          try {
            const response = await fetch(url, {
              signal: AbortSignal.timeout(5000),
            });
            const responseTime = Date.now() - start;
            return {
              name,
              status: response.ok ? 'ok' as const : 'error' as const,
              responseTime,
            };
          } catch {
            return {
              name,
              status: 'error' as const,
              responseTime: Date.now() - start,
            };
          }
        })
      );

      setData({
        status: 'online',
        responseTime: mainResponseTime,
        lastCheck: new Date(),
        version: statusData.server_version || 'Unknown',
        endpoints: endpointResults.map((result) =>
          result.status === 'fulfilled' ? result.value : {
            name: 'Unknown',
            status: 'error' as const,
            responseTime: null,
          }
        ),
      });

      toast({
        title: language === 'en' ? 'ESI Status Updated' : 'Статус ESI обновлен',
        description: language === 'en' ? 'All checks completed' : 'Все проверки завершены',
      });
    } catch (error) {
      setData((prev) => ({
        ...prev,
        status: 'offline',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        endpoints: prev.endpoints.map((ep) => ({ ...ep, status: 'error' })),
      }));

      toast({
        title: language === 'en' ? 'ESI Check Failed' : 'Проверка ESI не удалась',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkESI();
    // Auto-refresh every 5 minutes
    const interval = setInterval(checkESI, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {language === 'en' ? 'ESI API Status' : 'Статус ESI API'}
            </CardTitle>
            <CardDescription>
              {language === 'en' 
                ? 'EVE Online ESI API monitoring' 
                : 'Мониторинг ESI API EVE Online'}
            </CardDescription>
          </div>
          <Button
            onClick={checkESI}
            disabled={checking}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {data.status === 'online' && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {data.status === 'offline' && (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            {data.status === 'checking' && (
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
            <span className="font-medium">
              {language === 'en' ? 'Status' : 'Статус'}
            </span>
          </div>
          <Badge variant={data.status === 'online' ? 'default' : 'destructive'}>
            {data.status === 'online' && (language === 'en' ? 'Online' : 'Онлайн')}
            {data.status === 'offline' && (language === 'en' ? 'Offline' : 'Оффлайн')}
            {data.status === 'checking' && (language === 'en' ? 'Checking...' : 'Проверка...')}
          </Badge>
        </div>

        {/* Response Time */}
        {data.responseTime !== null && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">
                {language === 'en' ? 'Response Time' : 'Время отклика'}
              </span>
            </div>
            <span className="text-sm font-mono">{data.responseTime}ms</span>
          </div>
        )}

        {/* Version */}
        {data.version && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <span className="font-medium">
              {language === 'en' ? 'Server Version' : 'Версия сервера'}
            </span>
            <span className="text-sm font-mono">{data.version}</span>
          </div>
        )}

        {/* Last Check */}
        {data.lastCheck && (
          <div className="text-sm text-muted-foreground text-center">
            {language === 'en' ? 'Last checked: ' : 'Последняя проверка: '}
            {data.lastCheck.toLocaleString(language)}
          </div>
        )}

        {/* Endpoint Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">
            {language === 'en' ? 'Endpoint Status' : 'Статус эндпоинтов'}
          </h4>
          {data.endpoints.map((endpoint) => (
            <div
              key={endpoint.name}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
            >
              <div className="flex items-center gap-2">
                {endpoint.status === 'ok' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {endpoint.status === 'error' && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                {endpoint.status === 'checking' && (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <span className="text-sm">{endpoint.name}</span>
              </div>
              {endpoint.responseTime !== null && (
                <span className="text-xs font-mono text-muted-foreground">
                  {endpoint.responseTime}ms
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
