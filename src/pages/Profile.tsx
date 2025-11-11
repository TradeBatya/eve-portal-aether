import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SideNav } from "@/components/SideNav";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, User, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CharacterCard } from "@/components/profile/CharacterCard";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { ActivityStats } from "@/components/profile/ActivityStats";
import { AchievementsSection } from "@/components/profile/AchievementsSection";
import { AccountLinking } from "@/components/auth/AccountLinking";
import { DiscordIntegration } from "@/components/profile/DiscordIntegration";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface EveCharacter {
  id: string;
  character_id: number;
  character_name: string;
  corporation_name: string | null;
  alliance_name: string | null;
  wallet_balance: number | null;
  security_status: number | null;
  location_system_name: string | null;
  ship_type_name: string | null;
  is_main: boolean;
  created_at: string;
}

interface ProfileData {
  id: string;
  display_name: string | null;
  timezone: string | null;
  notification_settings: any;
  created_at: string;
  last_activity: string | null;
  dashboard_layout: any;
  avatar_url: string | null;
  discord_user_id: string | null;
  discord_username: string | null;
  discord_avatar: string | null;
  discord_connected_at: string | null;
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [characters, setCharacters] = useState<EveCharacter[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCharacters();
      fetchProfile();
    }
  }, [user]);

  const fetchCharacters = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("eve_characters")
      .select("id, character_id, character_name, corporation_name, alliance_name, wallet_balance, security_status, location_system_name, ship_type_name, is_main, created_at")
      .eq("user_id", user.id)
      .order("is_main", { ascending: false });

    if (error) {
      toast({
        title: language === "en" ? "Error" : "Ошибка",
        description: language === "en" ? "Failed to load characters" : "Не удалось загрузить персонажей",
        variant: "destructive",
      });
    } else {
      setCharacters(data || []);
    }
    setLoading(false);
  };

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data);
    } else {
      // Create profile if doesn't exist
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: user.id });
      
      if (!insertError) {
        fetchProfile();
      }
    }
  };

  const handleSetMainCharacter = async (characterId: string) => {
    if (!user) return;

    // Remove is_main from all characters
    await supabase
      .from("eve_characters")
      .update({ is_main: false })
      .eq("user_id", user.id);

    // Set is_main for selected character
    const { error } = await supabase
      .from("eve_characters")
      .update({ is_main: true })
      .eq("id", characterId);

    if (error) {
      toast({
        title: language === "en" ? "Error" : "Ошибка",
        description: language === "en" ? "Failed to set main character" : "Не удалось изменить основного персонажа",
        variant: "destructive",
      });
    } else {
      toast({
        title: language === "en" ? "Success" : "Успешно",
        description: language === "en" ? "Main character updated" : "Основной персонаж изменён",
      });
      fetchCharacters();
    }
  };

  const handleRefreshCharacter = async (characterId: string) => {
    setRefreshingId(characterId);
    try {
      const { error } = await supabase.functions.invoke('refresh-character', {
        body: { characterId, userId: user?.id },
      });

      if (error) throw error;

      toast({
        title: language === "en" ? "Success" : "Успешно",
        description: language === "en" ? "Character data updated" : "Данные персонажа обновлены",
      });
      await fetchCharacters();
    } catch (error) {
      console.error("Failed to refresh character:", error);
      toast({
        title: language === "en" ? "Error" : "Ошибка",
        description: language === "en" ? "Failed to update character data" : "Не удалось обновить данные персонажа",
        variant: "destructive",
      });
    } finally {
      setRefreshingId(null);
    }
  };

  const handleSaveSettings = async (settings: any) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: settings.displayName,
        timezone: settings.timezone,
        notification_settings: settings.notificationSettings,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: language === "en" ? "Error" : "Ошибка",
        description: language === "en" ? "Failed to save settings" : "Не удалось сохранить настройки",
        variant: "destructive",
      });
    } else {
      toast({
        title: language === "en" ? "Success" : "Успешно",
        description: language === "en" ? "Settings saved" : "Настройки сохранены",
      });
      fetchProfile();
    }
  };

  const handleDiscordDisconnect = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        discord_user_id: null,
        discord_username: null,
        discord_avatar: null,
        discord_email: null,
        discord_access_token: null,
        discord_refresh_token: null,
        discord_connected_at: null,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: language === "en" ? "Error" : "Ошибка",
        description: language === "en" 
          ? "Failed to disconnect Discord" 
          : "Не удалось отключить Discord",
        variant: "destructive",
      });
    } else {
      toast({
        title: language === "en" ? "Success" : "Успешно",
        description: language === "en" 
          ? "Discord disconnected" 
          : "Discord отключен",
      });
      fetchProfile();
    }
  };

  const handleAddCharacter = () => {
    if (!user?.id) {
      toast({
        title: language === "en" ? "Authentication required" : "Требуется авторизация",
        description: language === "en" ? "Please sign in to add characters" : "Войдите, чтобы добавить персонажей",
        variant: "destructive",
      });
      return;
    }

    if (characters.length >= 3) {
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SideNav isOpen={isSideNavOpen} onToggle={() => setIsSideNavOpen(!isSideNavOpen)} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSideNavOpen(!isSideNavOpen)}
          className="mb-4 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold font-orbitron flex items-center gap-2">
            <User className="w-8 h-8 text-primary" />
            {language === "en" ? "Profile" : "Профиль"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "en" 
              ? "Manage your characters and profile settings" 
              : "Управление персонажами и настройками профиля"}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Characters */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {language === "en" ? "EVE Online Characters" : "EVE Online Персонажи"}
                  </CardTitle>
                  {characters.length < 3 && (
                    <Button onClick={handleAddCharacter} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      {language === "en" ? "Add Character" : "Добавить персонажа"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {characters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>
                      {language === "en" 
                        ? "No characters linked yet" 
                        : "У вас пока нет привязанных персонажей"}
                    </p>
                    <Button onClick={handleAddCharacter} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      {language === "en" ? "Add Your First Character" : "Добавить первого персонажа"}
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {characters.map((character) => (
                      <CharacterCard
                        key={character.id}
                        character={character}
                        onSetMain={handleSetMainCharacter}
                        onRefresh={handleRefreshCharacter}
                        isRefreshing={refreshingId === character.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {profile && (
              <>
                <ActivityStats
                  joinDate={profile.created_at}
                  lastActivity={profile.last_activity || profile.created_at}
                  operationsCount={0}
                />
                <AchievementsSection />
              </>
            )}
          </div>

          {/* Right column - Settings */}
          <div className="space-y-6">
            {profile && (
              <>
                <ProfileSettings
                  displayName={profile.display_name || ""}
                  timezone={profile.timezone || "UTC"}
                  notificationSettings={profile.notification_settings || { email: true, discord: true }}
                  onSave={handleSaveSettings}
                />
                
                {profile.discord_user_id && profile.discord_username ? (
                  <DiscordIntegration
                    discordUsername={profile.discord_username}
                    discordAvatar={profile.discord_avatar}
                    discordUserId={profile.discord_user_id}
                    connectedAt={profile.discord_connected_at}
                    onDisconnect={handleDiscordDisconnect}
                  />
                ) : (
                  <AccountLinking
                    eveCharacters={characters}
                    discordConnected={false}
                    onEveConnect={handleAddCharacter}
                    onDiscordDisconnect={handleDiscordDisconnect}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
