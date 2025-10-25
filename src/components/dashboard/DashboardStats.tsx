import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, TrendingUp, Shield, Target } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Stats {
  onlinePilots: number;
  totalMembers: number;
  operationsToday: number;
  activeFleets: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    onlinePilots: 0,
    totalMembers: 0,
    operationsToday: 0,
    activeFleets: 0
  });
  const { language } = useLanguage();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Get total members
    const { count: membersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get operations today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: opsCount } = await supabase
      .from('fleet_operations')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', today.toISOString());

    // Get active fleets
    const { count: activeCount } = await supabase
      .from('fleet_operations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ongoing');

    setStats({
      onlinePilots: Math.floor(Math.random() * 50) + 10, // Mock data for now
      totalMembers: membersCount || 0,
      operationsToday: opsCount || 0,
      activeFleets: activeCount || 0
    });
  };

  const statItems = [
    {
      label: language === 'en' ? 'Online Pilots' : 'Пилотов онлайн',
      value: stats.onlinePilots,
      icon: Users,
      color: 'text-green-500'
    },
    {
      label: language === 'en' ? 'Total Members' : 'Всего участников',
      value: stats.totalMembers,
      icon: Shield,
      color: 'text-blue-500'
    },
    {
      label: language === 'en' ? 'Operations Today' : 'Операций сегодня',
      value: stats.operationsToday,
      icon: Target,
      color: 'text-yellow-500'
    },
    {
      label: language === 'en' ? 'Active Fleets' : 'Активных флотов',
      value: stats.activeFleets,
      icon: TrendingUp,
      color: 'text-red-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-3xl font-bold mt-2">{item.value}</p>
            </div>
            <item.icon className={`h-8 w-8 ${item.color}`} />
          </div>
        </Card>
      ))}
    </div>
  );
}