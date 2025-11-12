import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SideNav } from "@/components/SideNav";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Plug, Loader2, User, TrendingUp, Wallet, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { usePluginsData, useUserPlugins, useInstallPlugin, useTogglePlugin, useUninstallPlugin } from "@/hooks/usePlugins";

const Plugins = () => {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  const { data: availablePlugins, isLoading: pluginsLoading } = usePluginsData();
  const { data: userPlugins, isLoading: userPluginsLoading } = useUserPlugins(user?.id);
  const installPlugin = useInstallPlugin();
  const togglePlugin = useTogglePlugin();
  const uninstallPlugin = useUninstallPlugin();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || pluginsLoading || userPluginsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPluginInstalled = (pluginId: string) => {
    return userPlugins?.some(up => up.plugin_id === pluginId);
  };

  const getUserPlugin = (pluginId: string) => {
    return userPlugins?.find(up => up.plugin_id === pluginId);
  };

  const getPluginIcon = (pluginId: string) => {
    switch (pluginId) {
      case 'character-overview':
        return <User className="w-5 h-5" />;
      case 'skill-monitor':
        return <TrendingUp className="w-5 h-5" />;
      case 'wallet-tracker':
        return <Wallet className="w-5 h-5" />;
      case 'asset-manager':
        return <Package className="w-5 h-5" />;
      default:
        return <Plug className="w-5 h-5" />;
    }
  };

  const t = {
    en: {
      title: "Plugins",
      subtitle: "Manage your installed plugins",
      available: "Available Plugins",
      installed: "Installed Plugins",
      install: "Install",
      uninstall: "Uninstall",
      enable: "Enable",
      disable: "Disable",
      version: "Version",
      author: "Author",
      noPlugins: "No plugins available",
      noInstalled: "No plugins installed yet",
    },
    ru: {
      title: "Плагины",
      subtitle: "Управление установленными плагинами",
      available: "Доступные плагины",
      installed: "Установленные плагины",
      install: "Установить",
      uninstall: "Удалить",
      enable: "Включить",
      disable: "Отключить",
      version: "Версия",
      author: "Автор",
      noPlugins: "Нет доступных плагинов",
      noInstalled: "Плагины еще не установлены",
    },
  }[language];

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

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-orbitron flex items-center gap-2">
            <Plug className="w-8 h-8 text-primary" />
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-2">{t.subtitle}</p>
        </div>

        {/* Installed Plugins */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t.installed}</h2>
          {userPlugins && userPlugins.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userPlugins.map((userPlugin) => (
                <Card key={userPlugin.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {getPluginIcon(userPlugin.plugins?.plugin_id || '')}
                        </div>
                        <span>{userPlugin.plugins?.name}</span>
                      </div>
                      <Switch
                        checked={userPlugin.enabled}
                        onCheckedChange={(checked) => 
                          togglePlugin.mutate({ id: userPlugin.id, enabled: checked })
                        }
                      />
                    </CardTitle>
                    <CardDescription>
                      {userPlugin.plugins?.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{t.version}:</span>
                      <Badge variant="secondary">{userPlugin.plugins?.version}</Badge>
                    </div>
                    {userPlugin.plugins?.author && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{t.author}:</span>
                        <span>{userPlugin.plugins.author}</span>
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => uninstallPlugin.mutate(userPlugin.id)}
                    >
                      {t.uninstall}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t.noInstalled}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Available Plugins */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t.available}</h2>
          {availablePlugins && availablePlugins.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availablePlugins
                .filter(plugin => !isPluginInstalled(plugin.id))
                .map((plugin) => (
                  <Card key={plugin.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {getPluginIcon(plugin.plugin_id)}
                        </div>
                        {plugin.name}
                      </CardTitle>
                      <CardDescription>{plugin.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{t.version}:</span>
                        <Badge variant="secondary">{plugin.version}</Badge>
                      </div>
                      {plugin.author && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{t.author}:</span>
                          <span>{plugin.author}</span>
                        </div>
                      )}
                      <Button
                        className="w-full mt-4"
                        onClick={() => installPlugin.mutate({ 
                          userId: user!.id, 
                          pluginId: plugin.id 
                        })}
                      >
                        {t.install}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t.noPlugins}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Plugins;
