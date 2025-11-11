import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface Achievement {
  id: string;
  key: string;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  icon: string;
  category: string;
  points: number;
  requirement_count: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  progress: number;
  unlocked_at: string | null;
  achievements: Achievement;
}

export const AchievementsSection = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    // Fetch all achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (achievements) {
      setAllAchievements(achievements);
    }

    // Fetch user's progress
    const { data: userProgress } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', user.id);

    if (userProgress) {
      setUserAchievements(userProgress as any);
      
      // Calculate total points from unlocked achievements
      const points = userProgress
        .filter(ua => ua.unlocked_at)
        .reduce((sum, ua) => sum + (ua.achievements as any).points, 0);
      setTotalPoints(points);
    }
  };

  const getAchievementProgress = (achievementId: string) => {
    return userAchievements.find(ua => ua.achievement_id === achievementId);
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, { en: string; ru: string }> = {
      operations: { en: 'Operations', ru: 'Операции' },
      intel: { en: 'Intelligence', ru: 'Разведка' },
      activity: { en: 'Activity', ru: 'Активность' },
      special: { en: 'Special', ru: 'Особые' }
    };
    return names[category]?.[language] || category;
  };

  const groupedAchievements = allAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {language === 'en' ? 'Achievements' : 'Достижения'}
          </CardTitle>
          <Badge variant="secondary" className="text-lg">
            {totalPoints} {language === 'en' ? 'points' : 'очков'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedAchievements).map(([category, achievements]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {getCategoryName(category)}
            </h3>
            <div className="grid gap-3">
              {achievements.map((achievement) => {
                const progress = getAchievementProgress(achievement.id);
                const isUnlocked = progress?.unlocked_at !== null;
                const progressValue = progress?.progress || 0;
                const progressPercent = (progressValue / achievement.requirement_count) * 100;

                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isUnlocked
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-3xl ${!isUnlocked && 'grayscale opacity-50'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className={`font-semibold ${isUnlocked ? 'text-primary' : ''}`}>
                              {language === 'en' ? achievement.name_en : achievement.name_ru}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {language === 'en' ? achievement.description_en : achievement.description_ru}
                            </p>
                          </div>
                          <Badge variant={isUnlocked ? 'default' : 'outline'} className="ml-2">
                            {achievement.points} {language === 'en' ? 'pts' : 'оч'}
                          </Badge>
                        </div>
                        {!isUnlocked && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{language === 'en' ? 'Progress' : 'Прогресс'}</span>
                              <span>{progressValue}/{achievement.requirement_count}</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                        )}
                        {isUnlocked && (
                          <p className="text-xs text-primary">
                            ✓ {language === 'en' ? 'Unlocked' : 'Получено'}{' '}
                            {new Date(progress!.unlocked_at!).toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};