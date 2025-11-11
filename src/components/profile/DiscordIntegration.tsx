import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

interface DiscordIntegrationProps {
  discordUsername: string | null;
  discordAvatar: string | null;
  discordUserId: string | null;
  connectedAt: string | null;
  onDisconnect: () => void;
}

export const DiscordIntegration = ({
  discordUsername,
  discordAvatar,
  discordUserId,
  connectedAt,
  onDisconnect,
}: DiscordIntegrationProps) => {
  const { language } = useLanguage();

  const t = {
    en: {
      title: "Discord Integration",
      username: "Username",
      connectedSince: "Connected since",
      status: "Status",
      active: "Active",
      disconnect: "Disconnect Discord",
      notifications: "Notifications enabled",
    },
    ru: {
      title: "Интеграция Discord",
      username: "Имя пользователя",
      connectedSince: "Подключен с",
      status: "Статус",
      active: "Активен",
      disconnect: "Отключить Discord",
      notifications: "Уведомления включены",
    },
  };

  const getDiscordAvatarUrl = (userId: string, avatarHash: string) => {
    if (!avatarHash) return null;
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`;
  };

  const avatarUrl = discordUserId && discordAvatar 
    ? getDiscordAvatarUrl(discordUserId, discordAvatar)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t[language].title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="Discord Avatar"
              className="w-16 h-16 rounded-full border-2 border-primary"
            />
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t[language].username}:</span>
              <span className="font-semibold">{discordUsername}</span>
            </div>
            {connectedAt && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t[language].connectedSince}:</span>
                <span className="text-sm">{format(new Date(connectedAt), "PPp")}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t[language].status}:</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {t[language].active}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {t[language].notifications}
              </Badge>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={onDisconnect}
          className="w-full"
        >
          {t[language].disconnect}
        </Button>
      </CardContent>
    </Card>
  );
};
