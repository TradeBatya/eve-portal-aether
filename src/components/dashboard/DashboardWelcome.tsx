import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ship, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EveCharacter {
  character_name: string;
  corporation_name: string | null;
  alliance_name: string | null;
  is_main: boolean;
}

export function DashboardWelcome() {
  const { user, isAdmin } = useAuth();
  const { language } = useLanguage();
  const [mainCharacter, setMainCharacter] = useState<EveCharacter | null>(null);

  useEffect(() => {
    if (user) {
      fetchMainCharacter();
    }
  }, [user]);

  const fetchMainCharacter = async () => {
    const { data } = await supabase
      .from('eve_characters')
      .select('character_name, corporation_name, alliance_name, is_main')
      .eq('user_id', user?.id)
      .eq('is_main', true)
      .maybeSingle();

    if (data) {
      setMainCharacter(data);
    }
  };

  const t = {
    en: {
      welcome: 'Welcome back',
      pilot: 'Pilot',
      mainCharacter: 'Main Character',
      corporation: 'Corporation',
      alliance: 'Alliance',
      admin: 'Administrator',
    },
    ru: {
      welcome: 'С возвращением',
      pilot: 'Пилот',
      mainCharacter: 'Основной персонаж',
      corporation: 'Корпорация',
      alliance: 'Альянс',
      admin: 'Администратор',
    },
  }[language];

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Ship className="h-6 w-6 text-primary" />
          {t.welcome}, {t.pilot}!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mainCharacter && (
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">{t.mainCharacter}:</span>
              <p className="text-lg font-semibold">{mainCharacter.character_name}</p>
            </div>
            
            {mainCharacter.corporation_name && (
              <div>
                <span className="text-sm text-muted-foreground">{t.corporation}:</span>
                <p className="font-medium">{mainCharacter.corporation_name}</p>
              </div>
            )}
            
            {mainCharacter.alliance_name && (
              <div>
                <span className="text-sm text-muted-foreground">{t.alliance}:</span>
                <p className="font-medium">{mainCharacter.alliance_name}</p>
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <Badge variant="default" className="flex items-center gap-1 w-fit">
            <Shield className="h-3 w-3" />
            {t.admin}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
