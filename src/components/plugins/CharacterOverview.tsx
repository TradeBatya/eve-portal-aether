import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Building, Shield, Loader2, MapPin, Ship, Coins, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useWallet } from "@/hooks/useWallet";
import { memberAuditAdapter } from "@/services/esi/adapters/MemberAuditAdapter";

export const CharacterOverview = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

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

  const mainCharacter = characters?.find(c => c.is_main) || characters?.[0];

  // Use new hooks for data fetching
  const { balance } = useWallet(mainCharacter?.character_id);

  // Get Member Audit metadata for location and ship info
  const { data: metadata } = useQuery({
    queryKey: ['member-audit-metadata', mainCharacter?.character_id],
    queryFn: async () => {
      if (!mainCharacter?.character_id) return null;
      
        const { data, error } = await supabase
        .from('member_audit_metadata')
        .select('*')
        .eq('character_id', mainCharacter.character_id)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!mainCharacter?.character_id,
  });

  const handleRefresh = async () => {
    if (!mainCharacter) return;
    
    setIsRefreshing(true);
    try {
      console.log('[CharacterOverview] Starting full refresh for character', mainCharacter.character_id);
      
      // Use MemberAuditAdapter for full refresh
      await memberAuditAdapter.refreshCharacterData(mainCharacter.character_id);
      
      console.log('[CharacterOverview] Invalidating queries...');
      await queryClient.invalidateQueries({ queryKey: ['member-audit-metadata'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      
      console.log('[CharacterOverview] Refresh completed successfully');
      toast({
        title: language === 'en' ? 'Success' : 'Успешно',
        description: language === 'en' 
          ? 'Character data refreshed successfully' 
          : 'Данные персонажа успешно обновлены',
      });
    } catch (error: any) {
      console.error('[CharacterOverview] Refresh error:', error);
      toast({
        title: language === 'en' ? 'Error' : 'Ошибка',
        description: error.message || (language === 'en' 
          ? 'Failed to refresh character data' 
          : 'Не удалось обновить данные персонажа'),
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const lastSyncTime = metadata?.last_update_at 
    ? formatDistanceToNow(new Date(metadata.last_update_at), { addSuffix: true })
    : (language === 'en' ? 'Never' : 'Никогда');

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
      refresh: "Refresh",
      lastSync: "Last sync",
      minutesAgo: "min ago",
      never: "Never",
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
      refresh: "Обновить",
      lastSync: "Последняя синхронизация",
      minutesAgo: "мин назад",
      never: "Никогда",
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t.title}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>
        </div>
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

        {/* Stats Grid - Use metadata from Member Audit */}
        <div className="grid grid-cols-2 gap-4">
          {mainCharacter.security_status !== null && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">{t.security}</div>
              <div className="font-semibold">
                {mainCharacter.security_status.toFixed(2)}
              </div>
            </div>
          )}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {t.wallet}
            </div>
            <div className="font-semibold">
              {!balance || balance.balance === undefined || balance.balance === null ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                `${balance.balance.toLocaleString()} ISK`
              )}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {t.location}
            </div>
            <div className="font-semibold text-sm">
              {!metadata?.location_name ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                metadata.location_name
              )}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Ship className="w-3 h-3" />
              {t.ship}
            </div>
            <div className="font-semibold text-sm">
              {!metadata?.ship_type_name ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                metadata.ship_type_name
              )}
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-between text-xs border-t pt-3">
          <span className="text-muted-foreground">{t.lastSync}:</span>
          <span className="font-medium text-muted-foreground">
            {lastSyncTime}
          </span>
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
