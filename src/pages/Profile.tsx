import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SideNav } from "@/components/SideNav";
import { Loader2 } from "lucide-react";

interface Profile {
  id: string;
  display_name: string | null;
  discord_id: string | null;
  discord_username: string | null;
  alliance_auth_id: string | null;
  alliance_auth_username: string | null;
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
    alliance_auth_id: "",
    alliance_auth_username: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      } else {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ id: user!.id });
        
        if (insertError) throw insertError;
        setProfile({ ...profile, id: user!.id });
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

  const handleSave = async () => {
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
        })
        .eq("id", user!.id);

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
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          ← {language === "en" ? "Back" : "Назад"}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>
              {language === "en" ? "User Profile" : "Личный кабинет"}
            </CardTitle>
            <CardDescription>
              {language === "en" 
                ? "Manage your profile and service integrations" 
                : "Управляйте профилем и интеграциями сервисов"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">
                {language === "en" ? "Email" : "Электронная почта"}
              </Label>
              <Input id="email" value={user?.email || ""} disabled />
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
                placeholder={language === "en" ? "Enter your display name" : "Введите имя"}
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                {language === "en" ? "Service Integrations" : "Интеграции сервисов"}
              </h3>

              <div className="space-y-4">
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">Discord</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="discordId">Discord ID</Label>
                      <Input
                        id="discordId"
                        value={profile.discord_id || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, discord_id: e.target.value })
                        }
                        placeholder={language === "en" ? "Enter Discord ID" : "Введите Discord ID"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discordUsername">
                        {language === "en" ? "Discord Username" : "Discord имя пользователя"}
                      </Label>
                      <Input
                        id="discordUsername"
                        value={profile.discord_username || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, discord_username: e.target.value })
                        }
                        placeholder={language === "en" ? "Enter Discord username" : "Введите Discord имя"}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">Alliance Auth</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="allianceAuthId">Alliance Auth ID</Label>
                      <Input
                        id="allianceAuthId"
                        value={profile.alliance_auth_id || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, alliance_auth_id: e.target.value })
                        }
                        placeholder={language === "en" ? "Enter Alliance Auth ID" : "Введите Alliance Auth ID"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allianceAuthUsername">
                        {language === "en" ? "Alliance Auth Username" : "Alliance Auth имя пользователя"}
                      </Label>
                      <Input
                        id="allianceAuthUsername"
                        value={profile.alliance_auth_username || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, alliance_auth_username: e.target.value })
                        }
                        placeholder={language === "en" ? "Enter Alliance Auth username" : "Введите Alliance Auth имя"}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "en" ? "Saving..." : "Сохранение..."}
                </>
              ) : (
                language === "en" ? "Save Changes" : "Сохранить изменения"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;