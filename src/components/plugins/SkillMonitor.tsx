import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Clock, Loader2, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export const SkillMonitor = () => {
  const { user } = useAuth();
  const { language } = useLanguage();

  const { data: mainCharacter } = useQuery({
    queryKey: ['main-character', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('eve_characters')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_main', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Mock skill queue data - in production this would come from ESI API
  const mockSkillQueue = [
    {
      skill_name: "Caldari Battleship V",
      level: 5,
      training_start: new Date(Date.now() - 86400000 * 2),
      training_end: new Date(Date.now() + 86400000 * 3),
      trained_sp: 1280000,
      total_sp: 2560000,
    },
    {
      skill_name: "Large Hybrid Turret V",
      level: 5,
      training_start: new Date(Date.now() + 86400000 * 3),
      training_end: new Date(Date.now() + 86400000 * 8),
      trained_sp: 0,
      total_sp: 1280000,
    },
    {
      skill_name: "Gunnery V",
      level: 5,
      training_start: new Date(Date.now() + 86400000 * 8),
      training_end: new Date(Date.now() + 86400000 * 10),
      trained_sp: 0,
      total_sp: 256000,
    },
  ];

  const t = {
    en: {
      title: "Skill Monitor",
      activeTraining: "Active Training",
      skillQueue: "Skill Queue",
      progress: "Progress",
      timeRemaining: "Time Remaining",
      queuedSkills: "Queued Skills",
      totalQueueTime: "Total Queue Time",
      noCharacter: "No main character set",
      noQueue: "No skills in training queue",
      sp: "SP",
      days: "days",
    },
    ru: {
      title: "Мониторинг навыков",
      activeTraining: "Активное обучение",
      skillQueue: "Очередь навыков",
      progress: "Прогресс",
      timeRemaining: "Осталось времени",
      queuedSkills: "Навыков в очереди",
      totalQueueTime: "Общее время очереди",
      noCharacter: "Основной персонаж не установлен",
      noQueue: "Нет навыков в очереди обучения",
      sp: "ОН",
      days: "дней",
    },
  }[language];

  if (!mainCharacter) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t.noCharacter}
        </CardContent>
      </Card>
    );
  }

  const activeSkill = mockSkillQueue[0];
  const progressPercent = (activeSkill.trained_sp / activeSkill.total_sp) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Training */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Badge variant="default" className="mb-2">
                {t.activeTraining}
              </Badge>
              <h4 className="font-semibold text-lg">
                {activeSkill.skill_name}
              </h4>
              <p className="text-sm text-muted-foreground">
                Level {activeSkill.level}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {progressPercent.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {t.progress}
              </div>
            </div>
          </div>
          
          <Progress value={progressPercent} className="h-3 mb-2" />
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {activeSkill.trained_sp.toLocaleString()} / {activeSkill.total_sp.toLocaleString()} {t.sp}
            </span>
            <span className="flex items-center gap-1 text-primary font-medium">
              <Clock className="w-4 h-4" />
              {formatDistanceToNow(activeSkill.training_end, { 
                locale: language === 'ru' ? ru : undefined,
                addSuffix: true 
              })}
            </span>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">{t.queuedSkills}</div>
            <div className="text-2xl font-bold">{mockSkillQueue.length}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">{t.totalQueueTime}</div>
            <div className="text-2xl font-bold">
              {Math.ceil((mockSkillQueue[mockSkillQueue.length - 1].training_end.getTime() - Date.now()) / 86400000)} {t.days}
            </div>
          </div>
        </div>

        {/* Skill Queue List */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {t.skillQueue}
          </h4>
          <div className="space-y-2">
            {mockSkillQueue.map((skill, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-colors ${
                  index === 0 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{skill.skill_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Level {skill.level} • {(skill.total_sp / 1000).toFixed(0)}k {t.sp}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {index === 0 ? (
                      <span className="text-primary font-medium">
                        {formatDistanceToNow(skill.training_end, { 
                          locale: language === 'ru' ? ru : undefined 
                        })}
                      </span>
                    ) : (
                      formatDistanceToNow(skill.training_start, { 
                        locale: language === 'ru' ? ru : undefined 
                      })
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
