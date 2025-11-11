import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export function NotificationCenter() {
  const { pings, intel } = useRealtimeNotifications();
  const { language } = useLanguage();

  const t = {
    en: {
      notifications: 'Notifications',
      pings: 'Pings',
      intel: 'Intel Reports',
      noPings: 'No active pings',
      noIntel: 'No recent intel',
      hostiles: 'hostiles',
      in: 'in',
    },
    ru: {
      notifications: 'Уведомления',
      pings: 'Пинги',
      intel: 'Intel отчёты',
      noPings: 'Нет активных пингов',
      noIntel: 'Нет недавних отчётов',
      hostiles: 'противников',
      in: 'в',
    },
  }[language];

  const totalNotifications = pings.length + intel.length;

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getThreatVariant = (threat: string) => {
    switch (threat) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <h3 className="font-semibold text-lg">{t.notifications}</h3>
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-4">
            {/* Pings Section */}
            <div>
              <h4 className="text-sm font-medium mb-2">{t.pings}</h4>
              {pings.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.noPings}</p>
              ) : (
                <div className="space-y-2">
                  {pings.map((ping) => (
                    <div
                      key={ping.id}
                      className="p-3 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="font-medium text-sm">{ping.title}</h5>
                        <Badge variant={getPriorityVariant(ping.priority)} className="text-xs">
                          {ping.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {ping.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(ping.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Intel Section */}
            <div>
              <h4 className="text-sm font-medium mb-2">{t.intel}</h4>
              {intel.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.noIntel}</p>
              ) : (
                <div className="space-y-2">
                  {intel.map((report) => (
                    <div
                      key={report.id}
                      className="p-3 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="font-medium text-sm">{report.system_name}</h5>
                        <Badge variant={getThreatVariant(report.threat_level)} className="text-xs">
                          {report.threat_level}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {report.activity_type} - {report.hostiles_count} {t.hostiles}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(report.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
