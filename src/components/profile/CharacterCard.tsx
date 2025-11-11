import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Building, Users, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface CharacterCardProps {
  character: {
    id: string;
    character_id: number;
    character_name: string;
    corporation_name?: string;
    alliance_name?: string;
    wallet_balance?: number;
    security_status?: number;
    location_system_name?: string;
    ship_type_name?: string;
    is_main: boolean;
    created_at: string;
  };
  onSetMain: (id: string) => void;
  onRefresh: (id: string) => void;
  isRefreshing?: boolean;
}

export const CharacterCard = ({ character, onSetMain, onRefresh, isRefreshing }: CharacterCardProps) => {
  const characterImageUrl = `https://images.evetech.net/characters/${character.character_id}/portrait?size=128`;

  return (
    <Card className="overflow-hidden border-border bg-card hover:border-primary/50 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src={characterImageUrl}
              alt={character.character_name}
              className="w-16 h-16 rounded-lg border border-border"
            />
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                {character.character_name}
                {character.is_main && (
                  <Badge variant="default" className="gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Основной
                  </Badge>
                )}
              </CardTitle>
              {character.corporation_name && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Building className="w-3 h-3" />
                  {character.corporation_name}
                </div>
              )}
              {character.alliance_name && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {character.alliance_name}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(character.wallet_balance !== null || character.location_system_name || character.ship_type_name) && (
          <div className="space-y-2 pb-3 border-b border-border">
            {character.wallet_balance !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Баланс:</span>
                <span className="font-mono">{character.wallet_balance.toLocaleString()} ISK</span>
              </div>
            )}
            {character.location_system_name && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Локация:</span>
                <span>{character.location_system_name}</span>
              </div>
            )}
            {character.ship_type_name && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Корабль:</span>
                <span>{character.ship_type_name}</span>
              </div>
            )}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Добавлен: {format(new Date(character.created_at), "dd.MM.yyyy HH:mm")}
        </div>
        <div className="flex gap-2">
          {!character.is_main && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetMain(character.id)}
              className="flex-1"
            >
              <Star className="w-4 h-4 mr-1" />
              Сделать основным
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefresh(character.id)}
            disabled={isRefreshing}
            className="flex-1"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
