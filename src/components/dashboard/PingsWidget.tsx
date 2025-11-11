import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Ping {
  id: string;
  title: string;
  message: string;
  priority: string;
  created_at: string;
}

export function PingsWidget() {
  const { language } = useLanguage();
  const [pings, setPings] = useState<Ping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPings();
  }, []);

  const fetchPings = async () => {
    const { data, error } = await supabase
      .from("ping_notifications")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      setPings(data);
    }
    setLoading(false);
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      default: return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          {language === "en" ? "Recent Pings" : "Последние пинги"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === "en" ? "Loading..." : "Загрузка..."}
          </div>
        ) : pings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{language === "en" ? "No active pings" : "Нет активных пингов"}</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {pings.map((ping) => (
              <div
                key={ping.id}
                className="p-4 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-sm">{ping.title}</h4>
                  </div>
                  <Badge variant={getPriorityVariant(ping.priority)} className="text-xs">
                    {ping.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {ping.message}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ping.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
