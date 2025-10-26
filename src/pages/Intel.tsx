import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateIntelDialog } from "@/components/intel/CreateIntelDialog";
import { AlertTriangle, Radio, MapPin, Clock, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { SideNav } from "@/components/SideNav";
import { translations } from "@/translations";

interface IntelReport {
  id: string;
  created_at: string;
  system_name: string;
  region_name: string | null;
  hostiles_count: number;
  hostile_corps: string[] | null;
  ship_types: string[] | null;
  activity_type: string;
  threat_level: string;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
}

const Intel = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [reports, setReports] = useState<IntelReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const t = translations[language];

  useEffect(() => {
    loadIntelReports();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('intel-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intel_reports'
        },
        () => {
          loadIntelReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadIntelReports = async () => {
    try {
      const { data, error } = await supabase
        .from('intel_reports')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast.error(language === "en" ? "Failed to load intel reports" : "Не удалось загрузить разведданные");
    } finally {
      setLoading(false);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      gateCamp: { en: "Gate Camp", ru: "Гейт-кемп" },
      roaming: { en: "Roaming Gang", ru: "Роуминг" },
      cynoBeacon: { en: "Cyno Beacon", ru: "Цино-маяк" },
      structure: { en: "Structure Activity", ru: "Структуры" },
      mining: { en: "Mining Fleet", ru: "Майнинг" },
      ratting: { en: "Ratting", ru: "Раттинг" },
      other: { en: "Other", ru: "Другое" }
    };
    return language === "en" ? labels[type]?.en : labels[type]?.ru;
  };

  const getThreatLabel = (level: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      critical: { en: "CRITICAL", ru: "КРИТИЧЕСКИЙ" },
      high: { en: "High", ru: "Высокий" },
      medium: { en: "Medium", ru: "Средний" },
      low: { en: "Low", ru: "Низкий" }
    };
    return language === "en" ? labels[level]?.en : labels[level]?.ru;
  };

  return (
    <div className="min-h-screen bg-background">
      <SideNav isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <Radio className="inline mr-3 h-10 w-10" />
              {language === "en" ? "Intelligence Center" : "Центр разведки"}
            </h1>
            <p className="text-muted-foreground">
              {language === "en" 
                ? "Real-time hostile activity tracking" 
                : "Отслеживание враждебной активности в реальном времени"}
            </p>
          </div>
          {user && <CreateIntelDialog onReportCreated={loadIntelReports} />}
        </div>

        {!user && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {language === "en" 
                ? "You must be logged in to view and submit intel reports." 
                : "Войдите в систему для просмотра и отправки разведданных."}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === "en" ? "Loading intel reports..." : "Загрузка разведданных..."}
            </p>
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Radio className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {language === "en" 
                  ? "No active hostile reports. All systems clear." 
                  : "Нет активных враждебных отчетов. Все системы чисты."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5" />
                        {report.system_name}
                      </CardTitle>
                      {report.region_name && (
                        <CardDescription className="mt-1">
                          {report.region_name}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={getThreatColor(report.threat_level)}>
                      {getThreatLabel(report.threat_level)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">
                      {getActivityLabel(report.activity_type)}
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {report.hostiles_count}
                    </div>
                  </div>

                  {report.ship_types && report.ship_types.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {report.ship_types.map((ship, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {ship}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {report.hostile_corps && report.hostile_corps.length > 0 && (
                    <div className="text-sm">
                      <span className="font-semibold">
                        {language === "en" ? "Hostiles:" : "Враги:"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {report.hostile_corps.join(", ")}
                      </span>
                    </div>
                  )}

                  {report.description && (
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    {report.expires_at && (
                      <span className="ml-2">
                        • {language === "en" ? "Expires" : "Истекает"} {formatDistanceToNow(new Date(report.expires_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Intel;