import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Ship } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function StatsWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [joinDate, setJoinDate] = useState<string>("");
  const [lastActivity, setLastActivity] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("created_at, last_activity")
      .eq("id", user.id)
      .single();

    if (data) {
      setJoinDate(new Date(data.created_at).toLocaleDateString());
      setLastActivity(
        data.last_activity 
          ? new Date(data.last_activity).toLocaleDateString()
          : new Date(data.created_at).toLocaleDateString()
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          {language === "en" ? "Your Stats" : "Ваша статистика"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              {language === "en" ? "Member since" : "Дата вступления"}
            </span>
          </div>
          <span className="text-sm font-semibold">{joinDate}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              {language === "en" ? "Last active" : "Последняя активность"}
            </span>
          </div>
          <span className="text-sm font-semibold">{lastActivity}</span>
        </div>
      </CardContent>
    </Card>
  );
}
