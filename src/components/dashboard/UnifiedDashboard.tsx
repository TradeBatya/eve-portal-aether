import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { CharacterOverview } from '@/components/plugins/CharacterOverview';
import { SkillMonitor } from '@/components/plugins/SkillMonitor';
import { WalletTracker } from '@/components/plugins/WalletTracker';
import { AssetManager } from '@/components/plugins/AssetManager';
import { MemberAudit } from '@/components/plugins/MemberAudit';
import { DashboardWelcome } from './DashboardWelcome';
import { DashboardStats } from './DashboardStats';

export function UnifiedDashboard() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  const t = {
    en: {
      overview: 'Overview',
      character: 'Character',
      wallet: 'Wallet',
      skills: 'Skills',
      assets: 'Assets',
      audit: 'Audit',
      loading: 'Loading character data...',
    },
    ru: {
      overview: 'Обзор',
      character: 'Персонаж',
      wallet: 'Финансы',
      skills: 'Навыки',
      assets: 'Активы',
      audit: 'Аудит',
      loading: 'Загрузка данных персонажа...',
    },
  }[language];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="unified-dashboard h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <TabsList className="w-full justify-start h-auto p-1 bg-transparent rounded-none border-0">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-3"
            >
              <span className="flex items-center gap-2">
                <span>📊</span>
                {t.overview}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="character"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-3"
            >
              <span className="flex items-center gap-2">
                <span>👤</span>
                {t.character}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="wallet"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-3"
            >
              <span className="flex items-center gap-2">
                <span>💰</span>
                {t.wallet}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="skills"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-3"
            >
              <span className="flex items-center gap-2">
                <span>🎓</span>
                {t.skills}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="assets"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-3"
            >
              <span className="flex items-center gap-2">
                <span>📦</span>
                {t.assets}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="audit"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-3"
            >
              <span className="flex items-center gap-2">
                <span>📋</span>
                {t.audit}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <TabsContent value="overview" className="mt-0">
            <div className="space-y-6">
              <DashboardWelcome />
              <DashboardStats />
            </div>
          </TabsContent>

          <TabsContent value="character" className="mt-0">
            <CharacterOverview />
          </TabsContent>

          <TabsContent value="wallet" className="mt-0">
            <WalletTracker />
          </TabsContent>

          <TabsContent value="skills" className="mt-0">
            <SkillMonitor />
          </TabsContent>

          <TabsContent value="assets" className="mt-0">
            <AssetManager />
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <MemberAudit />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
