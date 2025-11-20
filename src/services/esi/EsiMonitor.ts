import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from './CacheManager';
import { tokenManager } from './TokenManager';

export interface EsiMetrics {
  requestsTotal: number;
  requestsSuccess: number;
  requestsFailed: number;
  cacheHitRate: number;
  averageResponseTime: number;
  errorsByEndpoint: Record<string, number>;
  tokenRefreshCount: number;
  rateLimitHits: number;
  lastUpdated: string;
}

export interface TokenHealth {
  characterId: number;
  expiresIn: number;
  isExpired: boolean;
  lastRefresh: string | null;
  validationFailures: number;
  scopes: string[];
}

export interface EndpointStats {
  endpoint: string;
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  lastError: string | null;
  lastErrorTime: string | null;
}

/**
 * EsiMonitor - Мониторинг и метрики ESI сервиса
 */
class EsiMonitor {
  private static instance: EsiMonitor;
  private metricsCache: EsiMetrics | null = null;
  private cacheExpiry = 60000; // 1 минута

  private constructor() {}

  static getInstance(): EsiMonitor {
    if (!EsiMonitor.instance) {
      EsiMonitor.instance = new EsiMonitor();
    }
    return EsiMonitor.instance;
  }

  /**
   * Получить общие метрики
   */
  async getMetrics(): Promise<EsiMetrics> {
    // Проверяем кеш
    if (this.metricsCache && Date.now() - new Date(this.metricsCache.lastUpdated).getTime() < this.cacheExpiry) {
      return this.metricsCache;
    }

    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Получаем статистику за последний час
      const { data: logs, error } = await supabase
        .from('esi_service_request_logs')
        .select('*')
        .gte('accessed_at', oneHourAgo.toISOString())
        .order('accessed_at', { ascending: false });

      if (error) throw error;

      const total = logs?.length || 0;
      const successful = logs?.filter(l => l.status_code && l.status_code >= 200 && l.status_code < 400).length || 0;
      const failed = total - successful;

      const cacheHits = logs?.filter(l => l.cache_hit).length || 0;
      const cacheHitRate = total > 0 ? (cacheHits / total) * 100 : 0;

      const responseTimes = logs?.filter(l => l.response_time_ms).map(l => l.response_time_ms!) || [];
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Подсчет ошибок по эндпоинтам
      const errorsByEndpoint: Record<string, number> = {};
      logs?.filter(l => l.error_message).forEach(l => {
        errorsByEndpoint[l.endpoint] = (errorsByEndpoint[l.endpoint] || 0) + 1;
      });

      const rateLimitHits = logs?.filter(l => l.status_code === 429).length || 0;

      // Получаем статистику токенов
      const tokenStats = await tokenManager.getTokenStats();

      this.metricsCache = {
        requestsTotal: total,
        requestsSuccess: successful,
        requestsFailed: failed,
        cacheHitRate,
        averageResponseTime: Math.round(avgResponseTime),
        errorsByEndpoint,
        tokenRefreshCount: tokenStats.totalTokens,
        rateLimitHits,
        lastUpdated: now.toISOString()
      };

      return this.metricsCache;
    } catch (error) {
      console.error('[EsiMonitor] Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Получить здоровье всех токенов
   */
  async getTokenHealth(): Promise<TokenHealth[]> {
    try {
      const { data: tokens, error } = await supabase
        .from('esi_service_tokens')
        .select('*')
        .order('expires_at', { ascending: true });

      if (error) throw error;

      if (!tokens || tokens.length === 0) return [];

      const now = Date.now();

      return tokens.map(token => {
        const expiresAt = new Date(token.expires_at).getTime();
        const expiresIn = expiresAt - now;

        return {
          characterId: token.character_id,
          expiresIn: Math.max(0, expiresIn),
          isExpired: expiresIn <= 0,
          lastRefresh: token.updated_at,
          validationFailures: token.validation_failures || 0,
          scopes: token.scopes
        };
      });
    } catch (error) {
      console.error('[EsiMonitor] Error getting token health:', error);
      throw error;
    }
  }

  /**
   * Получить статистику по эндпоинтам
   */
  async getEndpointStats(limit = 10): Promise<EndpointStats[]> {
    try {
      const { data: logs, error } = await supabase
        .from('esi_service_request_logs')
        .select('endpoint, status_code, response_time_ms, error_message, accessed_at')
        .order('accessed_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      if (!logs || logs.length === 0) return [];

      // Группируем по эндпоинтам
      const endpointMap = new Map<string, {
        total: number;
        success: number;
        responseTimes: number[];
        lastError: string | null;
        lastErrorTime: string | null;
      }>();

      logs.forEach(log => {
        if (!endpointMap.has(log.endpoint)) {
          endpointMap.set(log.endpoint, {
            total: 0,
            success: 0,
            responseTimes: [],
            lastError: null,
            lastErrorTime: null
          });
        }

        const stats = endpointMap.get(log.endpoint)!;
        stats.total++;

        if (log.status_code && log.status_code >= 200 && log.status_code < 400) {
          stats.success++;
        }

        if (log.response_time_ms) {
          stats.responseTimes.push(log.response_time_ms);
        }

        if (log.error_message && !stats.lastError) {
          stats.lastError = log.error_message;
          stats.lastErrorTime = log.accessed_at;
        }
      });

      // Преобразуем в массив
      const endpointStats: EndpointStats[] = [];
      endpointMap.forEach((stats, endpoint) => {
        const avgResponseTime = stats.responseTimes.length > 0
          ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
          : 0;

        endpointStats.push({
          endpoint,
          totalRequests: stats.total,
          successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
          averageResponseTime: avgResponseTime,
          lastError: stats.lastError,
          lastErrorTime: stats.lastErrorTime
        });
      });

      // Сортируем по количеству запросов
      endpointStats.sort((a, b) => b.totalRequests - a.totalRequests);

      return endpointStats.slice(0, limit);
    } catch (error) {
      console.error('[EsiMonitor] Error getting endpoint stats:', error);
      throw error;
    }
  }

  /**
   * Получить недавние ошибки
   */
  async getRecentErrors(limit = 20) {
    try {
      const { data: errors, error } = await supabase
        .from('esi_service_request_logs')
        .select('*')
        .not('error_message', 'is', null)
        .order('accessed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return errors || [];
    } catch (error) {
      console.error('[EsiMonitor] Error getting recent errors:', error);
      throw error;
    }
  }

  /**
   * Получить статистику кеша
   */
  async getCacheStats() {
    return cacheManager.getStats();
  }

  /**
   * Очистить кеш метрик
   */
  clearMetricsCache(): void {
    this.metricsCache = null;
  }

  /**
   * Получить сводку здоровья системы
   */
  async getHealthSummary() {
    try {
      const [metrics, tokenHealth, cacheStats] = await Promise.all([
        this.getMetrics(),
        this.getTokenHealth(),
        this.getCacheStats()
      ]);

      const expiredTokens = tokenHealth.filter(t => t.isExpired).length;
      const expiringTokens = tokenHealth.filter(t => !t.isExpired && t.expiresIn < 10 * 60 * 1000).length;

      return {
        overall: metrics.requestsSuccess > metrics.requestsFailed ? 'healthy' : 'degraded',
        metrics,
        tokens: {
          total: tokenHealth.length,
          expired: expiredTokens,
          expiringSoon: expiringTokens,
          healthy: tokenHealth.length - expiredTokens - expiringTokens
        },
        cache: cacheStats
      };
    } catch (error) {
      console.error('[EsiMonitor] Error getting health summary:', error);
      throw error;
    }
  }
}

export const esiMonitor = EsiMonitor.getInstance();
