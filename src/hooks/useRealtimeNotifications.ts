import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface PingNotification {
  id: string;
  title: string;
  message: string;
  priority: string;
  created_at: string;
  expires_at: string | null;
}

interface IntelReport {
  id: string;
  system_name: string;
  threat_level: string;
  hostiles_count: number;
  activity_type: string;
  created_at: string;
}

export function useRealtimeNotifications() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [pings, setPings] = useState<PingNotification[]>([]);
  const [intel, setIntel] = useState<IntelReport[]>([]);

  const t = {
    en: {
      newPing: 'New Ping',
      newIntel: 'New Intel Report',
      in: 'in',
      hostiles: 'hostiles',
    },
    ru: {
      newPing: 'Новый пинг',
      newIntel: 'Новый Intel отчёт',
      in: 'в',
      hostiles: 'противников',
    },
  }[language];

  useEffect(() => {
    // Load initial data
    loadPings();
    loadIntel();

    // Subscribe to pings
    const pingsChannel = supabase
      .channel('pings-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ping_notifications',
        },
        (payload) => {
          const newPing = payload.new as PingNotification;
          setPings((current) => [newPing, ...current]);
          
          // Show toast notification
          toast({
            title: t.newPing,
            description: newPing.title,
            variant: newPing.priority === 'urgent' ? 'destructive' : 'default',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ping_notifications',
        },
        (payload) => {
          const updatedPing = payload.new as PingNotification;
          setPings((current) =>
            current.map((p) => (p.id === updatedPing.id ? updatedPing : p))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'ping_notifications',
        },
        (payload) => {
          setPings((current) => current.filter((p) => p.id !== payload.old.id));
        }
      )
      .subscribe();

    // Subscribe to intel reports
    const intelChannel = supabase
      .channel('intel-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'intel_reports',
        },
        (payload) => {
          const newIntel = payload.new as IntelReport;
          setIntel((current) => [newIntel, ...current]);
          
          // Show toast notification for high threat intel
          if (newIntel.threat_level === 'high' || newIntel.threat_level === 'critical') {
            toast({
              title: t.newIntel,
              description: `${newIntel.hostiles_count} ${t.hostiles} ${t.in} ${newIntel.system_name}`,
              variant: 'destructive',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'intel_reports',
        },
        (payload) => {
          const updatedIntel = payload.new as IntelReport;
          setIntel((current) =>
            current.map((i) => (i.id === updatedIntel.id ? updatedIntel : i))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'intel_reports',
        },
        (payload) => {
          setIntel((current) => current.filter((i) => i.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pingsChannel);
      supabase.removeChannel(intelChannel);
    };
  }, [language]);

  const loadPings = async () => {
    const { data } = await supabase
      .from('ping_notifications')
      .select('*')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setPings(data);
    }
  };

  const loadIntel = async () => {
    const { data } = await supabase
      .from('intel_reports')
      .select('*')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setIntel(data);
    }
  };

  return { pings, intel };
}
