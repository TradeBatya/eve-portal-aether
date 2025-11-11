import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SideNav } from "@/components/SideNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, TrendingUp, Users, Radio, Target, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TopPilot {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  operations_count: number;
  intel_count: number;
  total_score: number;
}

interface OperationStats {
  type: string;
  count: number;
}

interface IntelStats {
  threat_level: string;
  count: number;
}

export default function Statistics() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [topPilots, setTopPilots] = useState<TopPilot[]>([]);
  const [operationStats, setOperationStats] = useState<OperationStats[]>([]);
  const [intelStats, setIntelStats] = useState<IntelStats[]>([]);
  const [totalOperations, setTotalOperations] = useState(0);
  const [totalIntel, setTotalIntel] = useState(0);
  const [activePilots, setActivePilots] = useState(0);

  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user]);

  const loadStatistics = async () => {
    // Load top pilots
    const { data: signupsData } = await supabase
      .from("operation_signups")
      .select("user_id");

    const { data: intelData } = await supabase
      .from("intel_reports")
      .select("reported_by");

    // Count operations and intel per user
    const userStats = new Map<string, { operations: number; intel: number }>();

    signupsData?.forEach((signup) => {
      const current = userStats.get(signup.user_id) || { operations: 0, intel: 0 };
      userStats.set(signup.user_id, { ...current, operations: current.operations + 1 });
    });

    intelData?.forEach((report) => {
      if (report.reported_by) {
        const current = userStats.get(report.reported_by) || { operations: 0, intel: 0 };
        userStats.set(report.reported_by, { ...current, intel: current.intel + 1 });
      }
    });

    // Get profiles for top users
    const topUserIds = Array.from(userStats.entries())
      .sort((a, b) => (b[1].operations + b[1].intel * 2) - (a[1].operations + a[1].intel * 2))
      .slice(0, 10)
      .map(([userId]) => userId);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", topUserIds);

    const topPilotsData = profiles?.map((profile) => {
      const stats = userStats.get(profile.id) || { operations: 0, intel: 0 };
      return {
        user_id: profile.id,
        display_name: profile.display_name || "Unknown Pilot",
        avatar_url: profile.avatar_url,
        operations_count: stats.operations,
        intel_count: stats.intel,
        total_score: stats.operations + stats.intel * 2,
      };
    }).sort((a, b) => b.total_score - a.total_score) || [];

    setTopPilots(topPilotsData);
    setActivePilots(userStats.size);

    // Load operation statistics
    const { data: operations } = await supabase
      .from("fleet_operations")
      .select("operation_type");

    const opStats = new Map<string, number>();
    operations?.forEach((op) => {
      opStats.set(op.operation_type, (opStats.get(op.operation_type) || 0) + 1);
    });

    setOperationStats(
      Array.from(opStats.entries()).map(([type, count]) => ({ type, count }))
    );
    setTotalOperations(operations?.length || 0);

    // Load intel statistics
    const { data: intel } = await supabase
      .from("intel_reports")
      .select("threat_level");

    const intelStatsMap = new Map<string, number>();
    intel?.forEach((report) => {
      intelStatsMap.set(report.threat_level, (intelStatsMap.get(report.threat_level) || 0) + 1);
    });

    setIntelStats(
      Array.from(intelStatsMap.entries()).map(([threat_level, count]) => ({
        threat_level,
        count,
      }))
    );
    setTotalIntel(intel?.length || 0);
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SideNav isOpen={sideNavOpen} onToggle={() => setSideNavOpen(!sideNavOpen)} />

      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSideNavOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">
              {language === "en" ? "Alliance Statistics" : "Статистика альянса"}
            </h1>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "en" ? "Total Operations" : "Всего операций"}
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOperations}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "en" ? "Intel Reports" : "Intel отчётов"}
                </CardTitle>
                <Radio className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalIntel}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "en" ? "Active Pilots" : "Активных пилотов"}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activePilots}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "en" ? "Engagement Rate" : "Уровень активности"}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activePilots > 0 ? ((totalOperations / activePilots).toFixed(1)) : "0"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pilots" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pilots">
                {language === "en" ? "Top Pilots" : "Топ пилотов"}
              </TabsTrigger>
              <TabsTrigger value="operations">
                {language === "en" ? "Operations" : "Операции"}
              </TabsTrigger>
              <TabsTrigger value="intel">
                {language === "en" ? "Intel" : "Разведка"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pilots" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    {language === "en" ? "Most Active Pilots" : "Самые активные пилоты"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPilots.map((pilot, index) => (
                      <div
                        key={pilot.user_id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-2xl text-muted-foreground w-8">
                            #{index + 1}
                          </div>
                          <Avatar>
                            <AvatarImage src={pilot.avatar_url || undefined} />
                            <AvatarFallback>
                              {pilot.display_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{pilot.display_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {language === "en" ? "Score" : "Очки"}: {pilot.total_score}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {pilot.operations_count} {language === "en" ? "ops" : "оп."}
                          </Badge>
                          <Badge variant="secondary">
                            {pilot.intel_count} {language === "en" ? "intel" : "разв."}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === "en" ? "Operations by Type" : "Операции по типам"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {operationStats.map((stat) => (
                      <div key={stat.type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{stat.type}</span>
                          <span className="text-muted-foreground">{stat.count}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${(stat.count / totalOperations) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="intel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === "en"
                      ? "Intel Reports by Threat Level"
                      : "Intel отчёты по уровню угрозы"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {intelStats.map((stat) => (
                      <div key={stat.threat_level} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant={getThreatLevelColor(stat.threat_level) as any}>
                            {stat.threat_level.toUpperCase()}
                          </Badge>
                          <span className="text-muted-foreground">{stat.count}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${(stat.count / totalIntel) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
