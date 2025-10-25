import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Bell, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Ping {
  id: string;
  title: string;
  message: string;
  priority: string;
  created_at: string;
}

export function DashboardPings() {
  const [pings, setPings] = useState<Ping[]>([]);
  const { language } = useLanguage();

  useEffect(() => {
    fetchPings();

    const channel = supabase
      .channel('pings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ping_notifications' }, () => {
        fetchPings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPings = async () => {
    const { data } = await supabase
      .from('ping_notifications')
      .select('*')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(3);

    if (data) setPings(data);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-5 w-5" />;
      case 'high':
        return <Bell className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getPriorityVariant = (priority: string): "default" | "destructive" => {
    return priority === 'urgent' ? 'destructive' : 'default';
  };

  if (pings.length === 0) return null;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5" />
        {language === 'en' ? 'Important Alerts' : 'Важные оповещения'}
      </h2>
      <div className="space-y-3">
        {pings.map((ping) => (
          <Alert key={ping.id} variant={getPriorityVariant(ping.priority)}>
            {getPriorityIcon(ping.priority)}
            <AlertTitle>{ping.title}</AlertTitle>
            <AlertDescription>{ping.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    </Card>
  );
}