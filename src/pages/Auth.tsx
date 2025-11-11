import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Rocket, ShieldCheck, Users, Target, Radio, Zap, Database, Lock } from 'lucide-react';

export default function Auth() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = {
    en: {
      title: 'Advent Coalition Portal',
      subtitle: 'Advanced Fleet Management System',
      description: 'Secure ESI authentication for comprehensive corporation and alliance management',
      eveButton: 'Authenticate with EVE SSO',
      eveDesc: 'Full ESI access • Secure OAuth2 • Multi-character support',
      features: {
        title: 'Platform Capabilities',
        operation: 'Fleet Operations',
        operationDesc: 'Coordinate large-scale operations with real-time fleet composition and FC tools',
        intel: 'Intel Network',
        intelDesc: 'Live threat tracking across regions with automated hostile detection',
        community: 'Corporation Management',
        communityDesc: 'Manage members, roles, and permissions with EVE integration',
        realtime: 'Real-time Updates',
        realtimeDesc: 'WebSocket-based notifications for instant operation and intel alerts',
        database: 'Persistent Storage',
        databaseDesc: 'Secure database for operations history, intel archives, and analytics',
        security: 'Enterprise Security',
        securityDesc: 'Row-level security, encrypted credentials, and audit logging',
      },
      security: 'Enterprise-grade security with encrypted OAuth2 tokens',
      authInfo: 'EVE Online ESI authentication provides full access to character data, corporation information, and fleet management capabilities.',
    },
    ru: {
      title: 'Портал Advent Coalition',
      subtitle: 'Продвинутая система управления флотом',
      description: 'Безопасная ESI аутентификация для комплексного управления корпорацией и альянсом',
      eveButton: 'Авторизация через EVE SSO',
      eveDesc: 'Полный ESI доступ • Безопасный OAuth2 • Поддержка нескольких персонажей',
      features: {
        title: 'Возможности платформы',
        operation: 'Флотские операции',
        operationDesc: 'Координация крупномасштабных операций с отслеживанием состава флота в реальном времени',
        intel: 'Разведывательная сеть',
        intelDesc: 'Отслеживание угроз по регионам с автоматическим обнаружением враждебных сил',
        community: 'Управление корпорацией',
        communityDesc: 'Управление участниками, ролями и правами доступа с интеграцией EVE',
        realtime: 'Обновления в реальном времени',
        realtimeDesc: 'WebSocket-уведомления для мгновенных оповещений об операциях и разведданных',
        database: 'Постоянное хранилище',
        databaseDesc: 'Безопасная база данных для истории операций, архивов разведки и аналитики',
        security: 'Корпоративная безопасность',
        securityDesc: 'Защита на уровне строк, шифрование учетных данных и журналирование',
      },
      security: 'Корпоративная безопасность с шифрованием OAuth2 токенов',
      authInfo: 'Аутентификация EVE Online ESI предоставляет полный доступ к данным персонажей, информации корпорации и возможностям управления флотом.',
    },
  }[language];

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleEveLogin = () => {
    const clientId = '9b9086e27f4940d8a8c64c2881944375';
    const redirectUri = 'https://preview--eve-portal-aether.lovable.app/auth/eve/callback';
    
    // Full scope list for EVE SSO
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
      'esi-characterstats.read.v1',
      'esi-corporations.read_projects.v1',
    ].join(' ');

    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('eve_oauth_state', state);

    const authUrl = `https://login.eveonline.com/v2/oauth/authorize/?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&state=${state}`;
    
    window.location.href = authUrl;
  };


  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-12">
      <AnimatedBackground />
      <LanguageSwitcher />
      
      <div className="w-full max-w-6xl z-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">EVE Online Integration</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-orbitron font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            {t.title}
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto font-medium">
            {t.subtitle}
          </p>
          
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        {/* Main Auth Card */}
        <Card className="bg-card/95 backdrop-blur-md border-2 border-border shadow-2xl">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Auth Info */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.authInfo}
                </p>
              </div>

              {/* EVE Online Button */}
              <Button
                onClick={handleEveLogin}
                size="lg"
                className="w-full h-auto py-8 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-700 hover:via-orange-700 hover:to-amber-700 text-white shadow-2xl hover:shadow-primary/50 transition-all duration-300 border-2 border-amber-400/50"
              >
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex items-center gap-4">
                    <Rocket className="h-10 w-10" />
                    <div className="text-left">
                      <div className="text-2xl font-bold tracking-wide">{t.eveButton}</div>
                      <div className="text-sm opacity-90 font-medium mt-1">{t.eveDesc}</div>
                    </div>
                  </div>
                </div>
              </Button>

              {/* Security Notice */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="font-medium">{t.security}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-orbitron font-bold text-center text-foreground mb-6">
            {t.features.title}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-card/90 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t.features.operation}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.features.operationDesc}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/90 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Radio className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t.features.intel}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.features.intelDesc}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/90 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t.features.community}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.features.communityDesc}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/90 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t.features.realtime}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.features.realtimeDesc}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/90 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t.features.database}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.features.databaseDesc}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/90 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t.features.security}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.features.securityDesc}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
