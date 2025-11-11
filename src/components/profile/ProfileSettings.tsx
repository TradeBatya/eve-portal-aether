import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { useState } from "react";

interface ProfileSettingsProps {
  displayName: string;
  timezone: string;
  notificationSettings: {
    email: boolean;
    discord: boolean;
  };
  onSave: (settings: {
    displayName: string;
    timezone: string;
    notificationSettings: { email: boolean; discord: boolean };
  }) => void;
}

export const ProfileSettings = ({
  displayName,
  timezone,
  notificationSettings,
  onSave,
}: ProfileSettingsProps) => {
  const [localDisplayName, setLocalDisplayName] = useState(displayName || "");
  const [localTimezone, setLocalTimezone] = useState(timezone || "UTC");
  const [emailNotifications, setEmailNotifications] = useState(notificationSettings?.email ?? true);
  const [discordNotifications, setDiscordNotifications] = useState(notificationSettings?.discord ?? true);

  const handleSave = () => {
    onSave({
      displayName: localDisplayName,
      timezone: localTimezone,
      notificationSettings: {
        email: emailNotifications,
        discord: discordNotifications,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Настройки профиля
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="displayName">Отображаемое имя</Label>
          <Input
            id="displayName"
            value={localDisplayName}
            onChange={(e) => setLocalDisplayName(e.target.value)}
            placeholder="Введите ваше имя"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Часовой пояс</Label>
          <Input
            id="timezone"
            value={localTimezone}
            onChange={(e) => setLocalTimezone(e.target.value)}
            placeholder="UTC"
          />
        </div>

        <div className="space-y-4">
          <Label>Уведомления</Label>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="cursor-pointer">
              Email уведомления
            </Label>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="discord-notifications" className="cursor-pointer">
              Discord уведомления
            </Label>
            <Switch
              id="discord-notifications"
              checked={discordNotifications}
              onCheckedChange={setDiscordNotifications}
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Сохранить настройки
        </Button>
      </CardContent>
    </Card>
  );
};
