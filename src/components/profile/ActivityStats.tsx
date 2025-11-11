import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Award } from "lucide-react";

interface ActivityStatsProps {
  joinDate: string;
  lastActivity: string;
  operationsCount?: number;
}

export const ActivityStats = ({ joinDate, lastActivity, operationsCount = 0 }: ActivityStatsProps) => {
  const daysSinceJoin = Math.floor(
    (new Date().getTime() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Статистика активности
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm">В альянсе</span>
          </div>
          <span className="font-semibold">{daysSinceJoin} дней</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm">Участие в операциях</span>
          </div>
          <span className="font-semibold">{operationsCount}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm">Последняя активность</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(lastActivity).toLocaleDateString('ru-RU')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
