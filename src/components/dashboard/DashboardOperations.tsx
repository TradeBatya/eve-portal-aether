import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Operation {
  id: string;
  title: string;
  operation_type: string;
  fc_name: string;
  start_time: string;
  duration_minutes: number;
  location: string;
  max_participants: number;
  current_participants: number;
}

export function DashboardOperations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [signedUpOps, setSignedUpOps] = useState<Set<string>>(new Set());
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchOperations();
    if (user) fetchSignups();

    const channel = supabase
      .channel('operations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_operations' }, () => {
        fetchOperations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'operation_signups' }, () => {
        if (user) fetchSignups();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchOperations = async () => {
    const now = new Date().toISOString();
    const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('fleet_operations')
      .select('*')
      .eq('status', 'scheduled')
      .gte('start_time', now)
      .lte('start_time', tomorrow)
      .order('start_time', { ascending: true })
      .limit(3);

    if (data) setOperations(data);
  };

  const fetchSignups = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('operation_signups')
      .select('operation_id')
      .eq('user_id', user.id);

    if (data) {
      setSignedUpOps(new Set(data.map(s => s.operation_id)));
    }
  };

  const handleSignup = async (operationId: string) => {
    if (!user) {
      toast({
        title: language === 'en' ? 'Authentication required' : 'Требуется авторизация',
        description: language === 'en' ? 'Please sign in to join operations' : 'Войдите для записи на операции',
        variant: 'destructive'
      });
      return;
    }

    const { error } = await supabase
      .from('operation_signups')
      .insert({ operation_id: operationId, user_id: user.id });

    if (error) {
      toast({
        title: language === 'en' ? 'Error' : 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: language === 'en' ? 'Signed up!' : 'Записаны!',
        description: language === 'en' ? 'You are now registered for this operation' : 'Вы зарегистрированы на операцию'
      });
      fetchSignups();
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pvp: 'destructive',
      pve: 'default',
      mining: 'secondary',
      training: 'outline'
    };
    return colors[type] || 'default';
  };

  if (operations.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {language === 'en' ? 'Upcoming Operations' : 'Ближайшие операции'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'en' ? 'No operations scheduled' : 'Операций не запланировано'}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        {language === 'en' ? 'Upcoming Operations' : 'Ближайшие операции'}
      </h2>
      <div className="space-y-4">
        {operations.map((op) => (
          <div key={op.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{op.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(op.start_time), 'PPp')}
                </div>
              </div>
              <Badge variant={getTypeColor(op.operation_type) as any}>
                {op.operation_type.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {op.current_participants}/{op.max_participants || '∞'}
              </div>
              {op.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {op.location}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">FC: {op.fc_name}</span>
              {signedUpOps.has(op.id) ? (
                <Button variant="outline" size="sm" disabled>
                  {language === 'en' ? 'Signed Up' : 'Записан'}
                </Button>
              ) : (
                <Button size="sm" onClick={() => handleSignup(op.id)}>
                  {language === 'en' ? 'Sign Up' : 'Записаться'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}