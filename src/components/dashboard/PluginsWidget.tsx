import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug, Loader2, User, TrendingUp, Wallet, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserPlugins } from "@/hooks/usePlugins";
import { CharacterOverview } from "@/components/plugins/CharacterOverview";
import { SkillMonitor } from "@/components/plugins/SkillMonitor";
import { WalletTracker } from "@/components/plugins/WalletTracker";
import { AssetManager } from "@/components/plugins/AssetManager";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const PluginsWidget = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: userPlugins, isLoading } = useUserPlugins(user?.id);

  const t = {
    en: {
      title: "Active Plugins",
      manage: "Manage Plugins",
      noPlugins: "No plugins installed",
      installPlugins: "Install plugins to extend your dashboard functionality",
    },
    ru: {
      title: "Активные плагины",
      manage: "Управление плагинами",
      noPlugins: "Плагины не установлены",
      installPlugins: "Установите плагины для расширения функциональности панели",
    },
  }[language];

  const renderPlugin = (pluginId: string) => {
    switch (pluginId) {
      case 'character-overview':
        return <CharacterOverview key={pluginId} />;
      case 'skill-monitor':
        return <SkillMonitor key={pluginId} />;
      case 'wallet-tracker':
        return <WalletTracker key={pluginId} />;
      case 'asset-manager':
        return <AssetManager key={pluginId} />;
      default:
        return null;
    }
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const activePlugins = userPlugins?.filter(up => up.enabled && up.plugins) || [];

  if (activePlugins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="w-5 h-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">{t.installPlugins}</p>
          <Button onClick={() => navigate('/plugins')}>
            {t.manage}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Plug className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">{t.title}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/plugins')}>
          {t.manage}
        </Button>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {activePlugins.map((userPlugin) => 
          renderPlugin(userPlugin.plugins!.plugin_id)
        )}
      </div>
    </div>
  );
};
