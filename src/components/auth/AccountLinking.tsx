import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, MessageCircle, Link2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface AccountLinkingProps {
  eveCharacters?: any[];
  discordConnected?: boolean;
  onEveConnect?: () => void;
  onDiscordConnect?: () => void;
  onEveDisconnect?: (characterId: string) => void;
  onDiscordDisconnect?: () => void;
}

export const AccountLinking = ({
  eveCharacters = [],
  discordConnected = false,
  onEveConnect,
  onDiscordConnect,
  onEveDisconnect,
  onDiscordDisconnect,
}: AccountLinkingProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();

  const t = {
    en: {
      title: 'Linked Accounts',
      description: 'Connect your EVE Online and Discord accounts',
      eveTitle: 'EVE Online Characters',
      eveConnected: 'Connected',
      eveNotConnected: 'Not connected',
      eveAdd: 'Add Character',
      eveRemove: 'Remove',
      discordTitle: 'Discord',
      discordConnected: 'Connected',
      discordNotConnected: 'Not connected',
      discordConnect: 'Connect Discord',
      discordDisconnect: 'Disconnect',
      maxCharacters: 'Maximum 3 characters allowed',
    },
    ru: {
      title: 'Связанные аккаунты',
      description: 'Подключите ваши аккаунты EVE Online и Discord',
      eveTitle: 'Персонажи EVE Online',
      eveConnected: 'Подключено',
      eveNotConnected: 'Не подключено',
      eveAdd: 'Добавить персонажа',
      eveRemove: 'Удалить',
      discordTitle: 'Discord',
      discordConnected: 'Подключено',
      discordNotConnected: 'Не подключено',
      discordConnect: 'Подключить Discord',
      discordDisconnect: 'Отключить',
      maxCharacters: 'Максимум 3 персонажа',
    },
  }[language];

  const handleEveConnect = () => {
    if (!user) return;
    
    const clientId = '33d3a8bd979d4e72a41e2d5d6fa08e68';
    const redirectUri = `${window.location.origin}/auth/eve/callback`;
    
    const scopes = [
      'publicData',
      'esi-calendar.respond_calendar_events.v1',
      'esi-calendar.read_calendar_events.v1',
      'esi-location.read_location.v1',
      'esi-location.read_ship_type.v1',
      'esi-mail.organize_mail.v1',
      'esi-mail.read_mail.v1',
      'esi-mail.send_mail.v1',
      'esi-skills.read_skills.v1',
      'esi-skills.read_skillqueue.v1',
      'esi-wallet.read_character_wallet.v1',
      'esi-search.search_structures.v1',
      'esi-clones.read_clones.v1',
      'esi-characters.read_contacts.v1',
      'esi-universe.read_structures.v1',
      'esi-bookmarks.read_character_bookmarks.v1',
      'esi-killmails.read_killmails.v1',
      'esi-corporations.read_corporation_membership.v1',
      'esi-assets.read_assets.v1',
      'esi-fleets.read_fleet.v1',
      'esi-fleets.write_fleet.v1',
    ].join(' ');

    const state = `add_character_${user.id}`;
    sessionStorage.setItem('eve_oauth_state', state);

    const authUrl = `https://login.eveonline.com/v2/oauth/authorize/?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&state=${state}`;
    
    window.location.href = authUrl;
  };

  const handleDiscordConnect = () => {
    if (!user) return;
    
    const clientId = '1321556883606241422';
    const redirectUri = `${window.location.origin}/auth/discord/callback`;
    
    const scopes = ['identify', 'email', 'guilds', 'guilds.join'].join(' ');
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('discord_oauth_state', state);

    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
    
    window.location.href = authUrl;
  };

  const canAddCharacter = eveCharacters.length < 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* EVE Online Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold">{t.eveTitle}</h3>
            </div>
            {eveCharacters.length > 0 && (
              <Badge variant="secondary">{eveCharacters.length}/3</Badge>
            )}
          </div>

          {eveCharacters.length === 0 ? (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-4 w-4" />
                <span>{t.eveNotConnected}</span>
              </div>
              <Button onClick={onEveConnect || handleEveConnect} variant="outline" size="sm">
                <Rocket className="h-4 w-4 mr-2" />
                {t.eveAdd}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {eveCharacters.map((char) => (
                <div
                  key={char.character_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">{char.character_name}</p>
                      <p className="text-xs text-muted-foreground">{char.corporation_name}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => onEveDisconnect?.(char.character_id)}
                    variant="ghost"
                    size="sm"
                  >
                    {t.eveRemove}
                  </Button>
                </div>
              ))}
              {canAddCharacter && (
                <Button
                  onClick={onEveConnect || handleEveConnect}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  {t.eveAdd}
                </Button>
              )}
              {!canAddCharacter && (
                <p className="text-xs text-muted-foreground text-center">{t.maxCharacters}</p>
              )}
            </div>
          )}
        </div>

        {/* Discord Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold">{t.discordTitle}</h3>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {discordConnected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{t.discordConnected}</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t.discordNotConnected}</span>
                </>
              )}
            </div>
            {discordConnected ? (
              <Button onClick={onDiscordDisconnect} variant="ghost" size="sm">
                {t.discordDisconnect}
              </Button>
            ) : (
              <Button onClick={onDiscordConnect || handleDiscordConnect} variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t.discordConnect}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
