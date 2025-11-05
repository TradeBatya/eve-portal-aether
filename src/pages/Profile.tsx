import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { SideNav } from "@/components/SideNav";
import { Loader2, RefreshCw, Trash2, User, Shield } from "lucide-react";
import { UserRolesCard } from "@/components/profile/UserRolesCard";

interface Profile {
  id: string;
  display_name: string | null;
  discord_id: string | null;
  discord_username: string | null;
  discord_user_id: string | null;
  discord_avatar: string | null;
  discord_email: string | null;
  discord_connected_at: string | null;
  alliance_auth_id: string | null;
  alliance_auth_username: string | null;
  timezone: string | null;
}

interface EveCharacter {
  id: string;
  character_id: number;
  character_name: string;
  corporation_name: string | null;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    id: "",
    display_name: "",
    discord_id: "",
    discord_username: "",
    discord_user_id: "",
    discord_avatar: "",
    discord_email: "",
    discord_connected_at: "",
    alliance_auth_id: "",
    alliance_auth_username: "",
    timezone: "",
  });
  const [deleting, setDeleting] = useState(false);
  const [eveCharacters, setEveCharacters] = useState<EveCharacter[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id);
      loadEveCharacters(user.id);
    }
  }, [user]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      } else {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId });
        
        if (insertError) throw insertError;
        setProfile((prev) => ({ ...prev, id: userId }));
      }
    } catch (error: any) {
      toast({
        title: language === "en" ? "Error" : "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEveCharacters = async (userId: string) => {
    setLoadingCharacters(true);
    try {
      const { data, error } = await supabase
        .from('eve_characters')
        .select('id, character_id, character_name, corporation_name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEveCharacters(data || []);
    } catch (error: any) {
      toast({
        title: language === "en" ? "Error" : "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingCharacters(false);
    }
  };

  const handleAddEveCharacter = () => {
    if (!user?.id) {
      toast({
        title: language === "en" ? "Authentication required" : "Требуется авторизация",
        description: language === "en" ? "Please sign in to manage characters" : "Войдите, чтобы управлять персонажами",
        variant: "destructive",
      });
      return;
    }

    if (eveCharacters.length >= 3) {
      toast({
        title: language === "en" ? "Limit Reached" : "Достигнут лимит",
        description: language === "en" ? "Maximum 3 characters per account" : "Максимум 3 персонажа на аккаунт",
        variant: "destructive",
      });
      return;
    }

    const clientId = '9b9086e27f4940d8a8c64c2881944375';
    const redirectUri = `${window.location.origin}/auth/eve/callback`;
    const state = `add_character_${user.id}`;
    
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
      'esi-wallet.read_corporation_wallet.v1',
      'esi-search.search_structures.v1',
      'esi-clones.read_clones.v1',
      'esi-characters.read_contacts.v1',
      'esi-universe.read_structures.v1',
      'esi-killmails.read_killmails.v1',
      'esi-corporations.read_corporation_membership.v1',
      'esi-assets.read_assets.v1',
      'esi-planets.manage_planets.v1',
      'esi-fleets.read_fleet.v1',
      'esi-fleets.write_fleet.v1',
      'esi-ui.open_window.v1',
      'esi-ui.write_waypoint.v1',
      'esi-characters.write_contacts.v1',
      'esi-fittings.read_fittings.v1',
      'esi-fittings.write_fittings.v1',
      'esi-markets.structure_markets.v1',
      'esi-corporations.read_structures.v1',
      'esi-characters.read_loyalty.v1',
      'esi-characters.read_chat_channels.v1',
      'esi-characters.read_medals.v1',
      'esi-characters.read_standings.v1',
      'esi-characters.read_agents_research.v1',
      'esi-industry.read_character_jobs.v1',
      'esi-markets.read_character_orders.v1',
      'esi-characters.read_blueprints.v1',
      'esi-characters.read_corporation_roles.v1',
      'esi-location.read_online.v1',
      'esi-contracts.read_character_contracts.v1',
      'esi-clones.read_implants.v1',
      'esi-characters.read_fatigue.v1',
      'esi-killmails.read_corporation_killmails.v1',
      'esi-corporations.track_members.v1',
      'esi-wallet.read_corporation_wallets.v1',
      'esi-characters.read_notifications.v1',
      'esi-corporations.read_divisions.v1',
      'esi-corporations.read_contacts.v1',
      'esi-assets.read_corporation_assets.v1',
      'esi-corporations.read_titles.v1',
      'esi-corporations.read_blueprints.v1',
      'esi-contracts.read_corporation_contracts.v1',
      'esi-corporations.read_standings.v1',
      'esi-corporations.read_starbases.v1',
      'esi-industry.read_corporation_jobs.v1',
      'esi-markets.read_corporation_orders.v1',
      'esi-corporations.read_container_logs.v1',
      'esi-industry.read_character_mining.v1',
      'esi-industry.read_corporation_mining.v1',
      'esi-planets.read_customs_offices.v1',
      'esi-corporations.read_facilities.v1',
      'esi-corporations.read_medals.v1',
      'esi-characters.read_titles.v1',
      'esi-alliances.read_contacts.v1',
      'esi-characters.read_fw_stats.v1',
      'esi-corporations.read_fw_stats.v1',
      'esi-corporations.read_projects.v1'
    ].join(' ');
    
    const authUrl = `https://login.eveonline.com/v2/oauth/authorize/?` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `client_id=${clientId}&` +
      `scope=${encodeURIComponent(scopes)}&` +
        `state=${state}`;
    
    window.location.href = authUrl;
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      const { error } = await supabase
        .from('eve_characters')
        .delete()
        .eq('id', characterId);

      if (error) throw error;

      toast({
        title: language === "en" ? "Success" : "Успешно",
        description: language === "en" ? "Character removed" : "Персонаж удалён",
      });

      if (user?.id) {
        loadEveCharacters(user.id);
      }
    } catch (error: any) {
      toast({
        title: language === "en" ? "Error" : "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConnectDiscord = () => {
    if (!user?.id) {
      toast({
        title: language === "en" ? "Authentication required" : "Требуется авторизация",
        description: language === "en" ? "Please sign in to manage Discord integration" : "Войдите, чтобы управлять интеграцией Discord",
        variant: "destructive",
      });
      return;
    }

    const clientId = '1434699284179320932';
    const redirectUri = 'https://preview--eve-portal-aether.lovable.app/auth/discord/callback';
    const scope = 'identify email guilds connections';
    const state = `discord_${user.id}_${Date.now()}`;
    
    // Store state in sessionStorage for CSRF validation
    sessionStorage.setItem('discord_oauth_state', state);
    
    const authUrl = `https://discord.com/oauth2/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;
    
    window.location.href = authUrl;
  };

  const handleDisconnectDiscord = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          discord_user_id: null,
          discord_username: null,
          discord_avatar: null,
          discord_email: null,
          discord_access_token: null,
          discord_refresh_token: null,
          discord_connected_at: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({
        ...profile,
        discord_user_id: null,
        discord_username: null,
        discord_avatar: null,
        discord_email: null,
        discord_connected_at: null,
      });

      toast({
        title: language === "en" ? "Disconnected" : "Отключено",
        description: language === "en" ? "Discord has been disconnected" : "Discord был отключен",
      });
    } catch (error: any) {
      toast({
        title: language === "en" ? "Error" : "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: language === "en" ? "Authentication required" : "Требуется авторизация",
        description: language === "en" ? "Please sign in to update profile" : "Войдите, чтобы обновить профиль",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          discord_id: profile.discord_id,
          discord_username: profile.discord_username,
          alliance_auth_id: profile.alliance_auth_id,
          alliance_auth_username: profile.alliance_auth_username,
          timezone: profile.timezone,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: language === "en" ? "Success" : "Успешно",
        description: language === "en" ? "Profile updated successfully" : "Профиль успешно обновлен",
      });
    } catch (error: any) {
      toast({
        title: language === "en" ? "Error" : "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      return;
    }

    setDeleting(true);
    try {
      // First delete profile data
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);
      
      if (profileError) throw profileError;

      // Sign out - this will revoke the session
      await supabase.auth.signOut();

      toast({
        title: language === "en" ? "Account Deleted" : "Аккаунт удалён",
        description: language === "en" ? "Your account data has been deleted" : "Данные вашего аккаунта удалены",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: language === "en" ? "Error" : "Ошибка",
        description: error.message,
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SideNav isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary">
            {language === "en" ? "Account Details" : "Детали аккаунта"}
          </h1>
          <p className="text-muted-foreground">
            {language === "en" 
              ? "Manage your account settings and integrations" 
              : "Управляйте настройками аккаунта и интеграциями"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {language === "en" ? "Account Information" : "Информация об аккаунте"}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {language === "en" ? "Refresh" : "Обновить"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">
                    {language === "en" ? "Account Email" : "Email аккаунта"}
                  </Label>
                  <p className="text-lg font-medium">{user?.email || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {language === "en" ? "Status" : "Статус"}
                  </Label>
                  <p className="text-lg font-medium">
                    {language === "en" ? "Member" : "Участник"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">
                  {language === "en" ? "Display Name" : "Отображаемое имя"}
                </Label>
                <Input
                  id="displayName"
                  value={profile.display_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, display_name: e.target.value })
                  }
                  placeholder={language === "en" ? "Enter your display name" : "Введите отображаемое имя"}
                />
              </div>
            </CardContent>
          </Card>

          {/* EVE Online Characters */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {language === "en" ? "EVE Online Characters" : "Персонажи EVE Online"}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {eveCharacters.length}/3
                </div>
              </div>
              <CardDescription>
                {language === "en" 
                  ? "Manage your EVE Online characters (maximum 3)" 
                  : "Управление вашими персонажами EVE Online (максимум 3)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingCharacters ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {eveCharacters.length === 0 ? (
                    <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg text-center">
                      <p className="text-muted-foreground mb-4">
                        {language === "en" 
                          ? "No characters added yet" 
                          : "Персонажи еще не добавлены"}
                      </p>
                      <Button onClick={handleAddEveCharacter}>
                        <Shield className="h-4 w-4 mr-2" />
                        {language === "en" ? "Add First Character" : "Добавить первого персонажа"}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {eveCharacters.map((char) => (
                          <div
                            key={char.id}
                            className="flex items-center justify-between p-4 border border-primary/20 bg-primary/5 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://images.evetech.net/characters/${char.character_id}/portrait?size=64`}
                                alt={char.character_name}
                                className="w-12 h-12 rounded-full border-2 border-primary"
                              />
                              <div>
                                <p className="font-semibold">{char.character_name}</p>
                                {char.corporation_name && (
                                  <p className="text-sm text-muted-foreground">
                                    {char.corporation_name}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {language === "en" ? "ID:" : "ID:"} {char.character_id}
                                </p>
                              </div>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {language === "en" ? "Remove Character?" : "Удалить персонажа?"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === "en" 
                                      ? `Are you sure you want to remove ${char.character_name}?` 
                                      : `Вы уверены, что хотите удалить ${char.character_name}?`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {language === "en" ? "Cancel" : "Отмена"}
                                  </AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCharacter(char.id)}>
                                    {language === "en" ? "Remove" : "Удалить"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                      {eveCharacters.length < 3 && (
                        <Button 
                          onClick={handleAddEveCharacter} 
                          className="w-full"
                          variant="outline"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {language === "en" ? "Add Another Character" : "Добавить ещё персонажа"}
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Prime Timezone */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "en" ? "Prime Timezone" : "Основной часовой пояс"}
              </CardTitle>
              <CardDescription>
                {language === "en" 
                  ? "Select the timezone you're most active in" 
                  : "Выберите часовой пояс, в котором вы наиболее активны"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={profile.timezone || ""} 
                onValueChange={(value) => setProfile({ ...profile, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === "en" ? "Select your active timezone" : "Выберите ваш часовой пояс"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USTZ">USTZ (US Timezone)</SelectItem>
                  <SelectItem value="EUTZ">EUTZ (EU Timezone)</SelectItem>
                  <SelectItem value="AUTZ">AUTZ (AU Timezone)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Alliance Auth Integration */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {language === "en" ? "Advent Coalition Alliance Auth" : "Alliance Auth Advent Coalition"}
                </CardTitle>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.alliance_auth_id 
                    ? 'bg-success/20 text-success' 
                    : 'bg-warning/20 text-warning'
                }`}>
                  {profile.alliance_auth_id 
                    ? (language === "en" ? "Connected" : "Подключено")
                    : (language === "en" ? "Not Connected" : "Не подключено")
                  }
                </div>
              </div>
              <CardDescription>
                {language === "en" 
                  ? "Connect your Advent Coalition Alliance Auth account to access alliance services" 
                  : "Подключите Alliance Auth аккаунт Advent Coalition для доступа к сервисам альянса"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!profile.alliance_auth_id ? (
                <div className="p-4 border border-warning/50 bg-warning/10 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {language === "en" ? "Connect Alliance Auth" : "Подключить Alliance Auth"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === "en" 
                      ? "Connect your Alliance Auth account to sync your characters and access alliance services like Fleet Operations, SRP System, and Market Services." 
                      : "Подключите свой Alliance Auth аккаунт для синхронизации персонажей и доступа к сервисам альянса: флотовым операциям, SRP системе и рыночным сервисам."}
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: language === "en" ? "Alliance Auth Connection" : "Подключение Alliance Auth",
                        description: language === "en" 
                          ? "Alliance Auth OAuth integration will be available soon. Please contact alliance leadership for manual setup." 
                          : "OAuth интеграция Alliance Auth скоро будет доступна. Пожалуйста, свяжитесь с руководством альянса для ручной настройки.",
                      });
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {language === "en" ? "Connect to Alliance Auth" : "Подключить Alliance Auth"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border border-success/50 bg-success/10 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Shield className="h-4 w-4 text-success" />
                          {language === "en" ? "Alliance Information" : "Информация об альянсе"}
                        </h3>
                        <div className="text-sm space-y-1">
                          <p><strong>{language === "en" ? "Alliance:" : "Альянс:"}</strong> Advent Coalition</p>
                          <p><strong>{language === "en" ? "Username:" : "Имя пользователя:"}</strong> {profile.alliance_auth_username || "—"}</p>
                          <p><strong>{language === "en" ? "Auth ID:" : "Auth ID:"}</strong> {profile.alliance_auth_id}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: language === "en" ? "Refreshing..." : "Обновление...",
                            description: language === "en" ? "Syncing data with Alliance Auth" : "Синхронизация данных с Alliance Auth",
                          });
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {language === "en" ? "Refresh" : "Обновить"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-muted/30 border-muted">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                          {language === "en" ? "Fleet Operations" : "Флотовые операции"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">
                          {language === "en" 
                            ? "Join and manage fleet operations" 
                            : "Присоединяйтесь к флотовым операциям"}
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          {language === "en" ? "Access" : "Открыть"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-muted">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                          {language === "en" ? "SRP System" : "SRP Система"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">
                          {language === "en" 
                            ? "Ship Replacement Program" 
                            : "Программа замены кораблей"}
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          {language === "en" ? "Submit Claim" : "Подать заявку"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-muted">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                          {language === "en" ? "Market Services" : "Рыночные сервисы"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">
                          {language === "en" 
                            ? "Alliance market and contracts" 
                            : "Рынок и контракты альянса"}
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          {language === "en" ? "Browse" : "Открыть"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-muted">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                          {language === "en" ? "Intel Channel" : "Intel канал"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">
                          {language === "en" 
                            ? "Real-time intelligence" 
                            : "Разведка в реальном времени"}
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          {language === "en" ? "View Intel" : "Смотреть"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (confirm(language === "en" 
                          ? "Are you sure you want to disconnect Alliance Auth?" 
                          : "Вы уверены, что хотите отключить Alliance Auth?")) {
                          setProfile({ 
                            ...profile, 
                            alliance_auth_id: null, 
                            alliance_auth_username: null 
                          });
                          toast({
                            title: language === "en" ? "Disconnected" : "Отключено",
                            description: language === "en" 
                              ? "Alliance Auth has been disconnected" 
                              : "Alliance Auth был отключен",
                          });
                        }
                      }}
                    >
                      {language === "en" ? "Disconnect Alliance Auth" : "Отключить Alliance Auth"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discord Integration */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Discord
                </CardTitle>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.discord_user_id 
                    ? 'bg-success/20 text-success' 
                    : 'bg-warning/20 text-warning'
                }`}>
                  {profile.discord_user_id 
                    ? (language === "en" ? "Connected" : "Подключено")
                    : (language === "en" ? "Not Connected" : "Не подключено")
                  }
                </div>
              </div>
              <CardDescription>
                {language === "en" 
                  ? "Connect your Discord account for community access and notifications" 
                  : "Подключите Discord для доступа к сообществу и уведомлениям"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!profile.discord_user_id ? (
                <div className="p-4 border border-warning/50 bg-warning/10 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    {language === "en" ? "Connect Discord" : "Подключить Discord"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === "en" 
                      ? "Connect your Discord account to receive notifications and access community channels." 
                      : "Подключите Discord для получения уведомлений и доступа к каналам сообщества."}
                  </p>
                  <Button 
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
                    onClick={handleConnectDiscord}
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    {language === "en" ? "Connect to Discord" : "Подключить Discord"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border border-success/50 bg-success/10 rounded-lg">
                    <div className="flex items-start gap-4">
                      {profile.discord_avatar && (
                        <img 
                          src={`https://cdn.discordapp.com/avatars/${profile.discord_user_id}/${profile.discord_avatar}.png?size=128`}
                          alt="Discord avatar"
                          className="w-16 h-16 rounded-full"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <svg className="h-4 w-4 text-success" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                          {language === "en" ? "Connected Account" : "Подключенный аккаунт"}
                        </h3>
                        <div className="text-sm space-y-1">
                          <p><strong>{language === "en" ? "Username:" : "Имя пользователя:"}</strong> {profile.discord_username || "—"}</p>
                          {profile.discord_email && (
                            <p><strong>{language === "en" ? "Email:" : "Email:"}</strong> {profile.discord_email}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {language === "en" ? "Connected on:" : "Подключено:"} {profile.discord_connected_at ? new Date(profile.discord_connected_at).toLocaleDateString() : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDisconnectDiscord}
                    >
                      {language === "en" ? "Disconnect Discord" : "Отключить Discord"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

            {/* User Roles & Permissions */}
            {user?.id && <UserRolesCard userId={user.id} />}

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === "en" ? "Saving..." : "Сохранение..."}
              </>
            ) : (
              language === "en" ? "Save Changes" : "Сохранить изменения"
            )}
          </Button>

          {/* Danger Zone */}
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                {language === "en" ? "Danger Zone" : "Опасная зона"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">
                    {language === "en" ? "Delete your account" : "Удалить ваш аккаунт"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "en" 
                      ? "Your profile and all data will be permanently removed" 
                      : "Ваш профиль и все данные будут окончательно удалены"}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>
                      {language === "en" ? "Delete Account" : "Удалить аккаунт"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {language === "en" ? "Are you absolutely sure?" : "Вы абсолютно уверены?"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {language === "en" 
                          ? "This action cannot be undone. This will permanently delete your account and remove all your data from our servers." 
                          : "Это действие нельзя отменить. Это навсегда удалит ваш аккаунт и все ваши данные с наших серверов."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {language === "en" ? "Cancel" : "Отмена"}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {language === "en" ? "Deleting..." : "Удаление..."}
                          </>
                        ) : (
                          language === "en" ? "Delete Account" : "Удалить аккаунт"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;