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

  // Get skill queue from Member Audit
  const { data: skillQueue } = useQuery({
    queryKey: ['member-audit-skillqueue', mainCharacter?.character_id],
    queryFn: async () => {
      if (!mainCharacter?.character_id) return [];
      
      const { data, error } = await supabase
        .from('member_audit_skillqueue')
        .select('*')
        .eq('character_id', mainCharacter.character_id)
        .order('queue_position', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!mainCharacter?.character_id,
  });

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

  if (!skillQueue || skillQueue.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t.noQueue}
        </CardContent>
      </Card>
    );
  }

  const activeSkill = skillQueue[0];
  const now = Date.now();
  const startTime = activeSkill.start_date ? new Date(activeSkill.start_date).getTime() : now;
  const endTime = activeSkill.finish_date ? new Date(activeSkill.finish_date).getTime() : now;
  const totalTime = endTime - startTime;
  const elapsed = now - startTime;
  const progressPercent = totalTime > 0 ? Math.min(100, Math.max(0, (elapsed / totalTime) * 100)) : 0;

  const trainedSp = activeSkill.training_start_sp || 0;
  const totalSp = activeSkill.level_end_sp || activeSkill.training_start_sp || 0;

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
                Level {activeSkill.finished_level}
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
              {trainedSp.toLocaleString()} / {totalSp.toLocaleString()} {t.sp}
            </span>
            <span className="flex items-center gap-1 text-primary font-medium">
              <Clock className="w-4 h-4" />
              {activeSkill.finish_date && formatDistanceToNow(new Date(activeSkill.finish_date), { 
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
            <div className="text-2xl font-bold">{skillQueue.length}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">{t.totalQueueTime}</div>
            <div className="text-2xl font-bold">
              {skillQueue.length > 0 && skillQueue[skillQueue.length - 1].finish_date
                ? Math.ceil((new Date(skillQueue[skillQueue.length - 1].finish_date).getTime() - Date.now()) / 86400000)
                : 0} {t.days}
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
            {skillQueue.map((skill, index) => (
              <div
                key={skill.id}
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
                      Level {skill.finished_level} • {((skill.level_end_sp || 0) / 1000).toFixed(0)}k {t.sp}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {index === 0 && skill.finish_date ? (
                      <span className="text-primary font-medium">
                        {formatDistanceToNow(new Date(skill.finish_date), { 
                          locale: language === 'ru' ? ru : undefined 
                        })}
                      </span>
                    ) : skill.start_date ? (
                      formatDistanceToNow(new Date(skill.start_date), { 
                        locale: language === 'ru' ? ru : undefined 
                      })
                    ) : null}
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
