import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Radio, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function WelcomeWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [stats, setStats] = useState({ characters: 0, operations: 0, intel: 0 });
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchDisplayName();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    // Get characters count
    const { count: charactersCount } = await supabase
      .from("eve_characters")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Get operations count
    const { count: operationsCount } = await supabase
      .from("operation_signups")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Get active intel count
    const { count: intelCount } = await supabase
      .from("intel_reports")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    setStats({
      characters: charactersCount || 0,
      operations: operationsCount || 0,
      intel: intelCount || 0,
    });
  };

  const fetchDisplayName = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    if (data?.display_name) {
      setDisplayName(data.display_name);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/30">
      <CardHeader>
        <CardTitle className="text-2xl text-primary font-orbitron">
          {language === "en" ? "Welcome back" : "С возвращением"}
          {displayName && `, ${displayName}`}!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <User className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.characters}</p>
              <p className="text-sm text-muted-foreground">
                {language === "en" ? "Characters" : "Персонажей"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <Rocket className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.operations}</p>
              <p className="text-sm text-muted-foreground">
                {language === "en" ? "Operations" : "Операций"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <Radio className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.intel}</p>
              <p className="text-sm text-muted-foreground">
                {language === "en" ? "Active Intel" : "Активных разведданных"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
