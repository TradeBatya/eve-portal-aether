import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, MapPin, AlertTriangle, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface IntelReport {
  id: string;
  system_name: string;
  region_name: string | null;
  threat_level: string;
  activity_type: string;
  hostiles_count: number;
  created_at: string;
}

export function IntelWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState<IntelReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntel();
  }, []);

  const fetchIntel = async () => {
    const { data, error } = await supabase
      .from("intel_reports")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      setReports(data);
    }
    setLoading(false);
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-destructive" />
            {language === "en" ? "Recent Intel" : "Последние разведданные"}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/intel")}
          >
            {language === "en" ? "View all" : "Все"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === "en" ? "Loading..." : "Загрузка..."}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{language === "en" ? "No active intel reports" : "Нет активных разведданных"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate("/intel")}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-foreground">{report.system_name}</h4>
                  </div>
                  <Badge variant={getThreatColor(report.threat_level)}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {report.threat_level}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{report.activity_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
