import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Building, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CharacterOverview = () => {
  const { user } = useAuth();
  const { language } = useLanguage();

  const { data: characters, isLoading } = useQuery({
    queryKey: ['eve-characters', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('eve_characters')
        .select('*')
        .eq('user_id', user.id)
        .order('is_main', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const t = {
    en: {
      title: "Character Overview",
      mainCharacter: "Main Character",
      corporation: "Corporation",
      alliance: "Alliance",
      security: "Security Status",
      wallet: "Wallet Balance",
      location: "Location",
      ship: "Current Ship",
      noCharacters: "No characters linked. Please link your EVE character.",
    },
    ru: {
      title: "Обзор персонажа",
      mainCharacter: "Основной персонаж",
      corporation: "Корпорация",
      alliance: "Альянс",
      security: "Статус безопасности",
      wallet: "Баланс кошелька",
      location: "Локация",
      ship: "Текущий корабль",
      noCharacters: "Нет привязанных персонажей. Пожалуйста, привяжите персонажа EVE.",
    },
  }[language];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!characters || characters.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t.noCharacters}
        </CardContent>
      </Card>
    );
  }

  const mainCharacter = characters.find(c => c.is_main) || characters[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Character */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage 
              src={`https://images.evetech.net/characters/${mainCharacter.character_id}/portrait?size=128`}
              alt={mainCharacter.character_name}
            />
            <AvatarFallback>{mainCharacter.character_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{mainCharacter.character_name}</h3>
              {mainCharacter.is_main && (
                <Badge variant="default">{t.mainCharacter}</Badge>
              )}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {mainCharacter.corporation_name && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>{mainCharacter.corporation_name}</span>
                </div>
              )}
              {mainCharacter.alliance_name && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>{mainCharacter.alliance_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {mainCharacter.security_status !== null && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">{t.security}</div>
              <div className="font-semibold">
                {mainCharacter.security_status.toFixed(2)}
              </div>
            </div>
          )}
          {mainCharacter.wallet_balance !== null && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">{t.wallet}</div>
              <div className="font-semibold">
                {Number(mainCharacter.wallet_balance).toLocaleString()} ISK
              </div>
            </div>
          )}
          {mainCharacter.location_system_name && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">{t.location}</div>
              <div className="font-semibold text-sm">
                {mainCharacter.location_system_name}
              </div>
            </div>
          )}
          {mainCharacter.ship_type_name && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">{t.ship}</div>
              <div className="font-semibold text-sm">
                {mainCharacter.ship_type_name}
              </div>
            </div>
          )}
        </div>

        {/* All Characters */}
        {characters.length > 1 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">
              {language === 'en' ? 'All Characters' : 'Все персонажи'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={`https://images.evetech.net/characters/${char.character_id}/portrait?size=64`}
                      alt={char.character_name}
                    />
                    <AvatarFallback>{char.character_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{char.character_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
