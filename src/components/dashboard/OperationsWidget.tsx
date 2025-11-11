import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Calendar, User, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Operation {
  id: string;
  title: string;
  start_time: string;
  fc_name: string;
  operation_type: string;
  status: string;
}

export function OperationsWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    const { data, error } = await supabase
      .from("fleet_operations")
      .select("*")
      .in("status", ["scheduled", "ongoing"])
      .order("start_time", { ascending: true })
      .limit(3);

    if (!error && data) {
      setOperations(data);
    }
    setLoading(false);
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case "pvp": return "text-destructive";
      case "pve": return "text-accent";
      case "mining": return "text-primary";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            {language === "en" ? "Active Operations" : "Активные операции"}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/operations")}
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
        ) : operations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{language === "en" ? "No active operations" : "Нет активных операций"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {operations.map((op) => (
              <div
                key={op.id}
                className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate("/operations")}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-foreground">{op.title}</h4>
                  <span className={`text-xs uppercase font-bold ${getOperationTypeColor(op.operation_type)}`}>
                    {op.operation_type}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(op.start_time), "MMM dd, HH:mm")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{op.fc_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
