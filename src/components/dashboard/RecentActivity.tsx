import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar, Radio, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'operation' | 'intel' | 'ping';
  title: string;
  created_at: string;
  status?: string;
  priority?: string;
  threat_level?: string;
}

export function RecentActivity() {
  const { language } = useLanguage();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    en: {
      title: 'Recent Activity',
      noActivity: 'No recent activity',
      operation: 'Operation',
      intel: 'Intel Report',
      ping: 'Ping',
    },
    ru: {
      title: 'Недавняя активность',
      noActivity: 'Нет недавней активности',
      operation: 'Операция',
      intel: 'Intel отчёт',
      ping: 'Пинг',
    },
  }[language];

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const [opsData, intelData, pingsData] = await Promise.all([
        supabase
          .from('fleet_operations')
          .select('id, title, created_at, status')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('intel_reports')
          .select('id, system_name, created_at, threat_level')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('ping_notifications')
          .select('id, title, created_at, priority')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const combined: ActivityItem[] = [
        ...(opsData.data || []).map(op => ({
          id: op.id,
          type: 'operation' as const,
          title: op.title,
          created_at: op.created_at,
          status: op.status,
        })),
        ...(intelData.data || []).map(intel => ({
          id: intel.id,
          type: 'intel' as const,
          title: intel.system_name,
          created_at: intel.created_at,
          threat_level: intel.threat_level,
        })),
        ...(pingsData.data || []).map(ping => ({
          id: ping.id,
          type: 'ping' as const,
          title: ping.title,
          created_at: ping.created_at,
          priority: ping.priority,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

      setActivities(combined);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'operation':
        return <Calendar className="h-4 w-4" />;
      case 'intel':
        return <Radio className="h-4 w-4" />;
      case 'ping':
        return <Bell className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'operation':
        return t.operation;
      case 'intel':
        return t.intel;
      case 'ping':
        return t.ping;
      default:
        return type;
    }
  };

  const getBadgeVariant = (activity: ActivityItem) => {
    if (activity.priority === 'urgent' || activity.threat_level === 'critical') {
      return 'destructive';
    }
    if (activity.status === 'ongoing') {
      return 'default';
    }
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{language === 'en' ? 'Loading...' : 'Загрузка...'}</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noActivity}</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getBadgeVariant(activity)} className="text-xs">
                      {getTypeLabel(activity.type)}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
