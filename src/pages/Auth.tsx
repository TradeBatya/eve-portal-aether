import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Rocket, ShieldCheck } from 'lucide-react';

export default function Auth() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = {
    en: {
      title: 'Join Advent Coalition',
      subtitle: 'Connect with EVE Online and Discord',
      description: 'Link your accounts to access operations, intel reports, and join our community.',
      eveButton: 'Login with EVE Online',
      eveDesc: 'Full ESI access for character management',
      discordButton: 'Login with Discord',
      discordDesc: 'Join our community server',
      features: {
        title: 'Why Join Us?',
        operation: 'Fleet Operations',
        operationDesc: 'Participate in organized fleet ops',
        intel: 'Intel Network',
        intelDesc: 'Real-time hostile activity tracking',
        community: 'Active Community',
        communityDesc: 'Connect with corp members',
      },
      security: 'Your data is secure and encrypted',
    },
    ru: {
      title: 'Присоединяйтесь к Advent Coalition',
      subtitle: 'Подключите EVE Online и Discord',
      description: 'Свяжите аккаунты для доступа к операциям, разведданным и нашему сообществу.',
      eveButton: 'Войти через EVE Online',
      eveDesc: 'Полный ESI доступ для управления персонажами',
      discordButton: 'Войти через Discord',
      discordDesc: 'Присоединиться к серверу сообщества',
      features: {
        title: 'Почему мы?',
        operation: 'Флотские операции',
        operationDesc: 'Участвуйте в организованных операциях',
        intel: 'Разведсеть',
        intelDesc: 'Отслеживание враждебной активности',
        community: 'Активное сообщество',
        communityDesc: 'Общайтесь с членами корпорации',
      },
      security: 'Ваши данные защищены и зашифрованы',
    },
  }[language];

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleEveLogin = () => {
    const clientId = '9b9086e27f4940d8a8c64c2881944375';
    const redirectUri = `${window.location.origin}/auth/eve/callback`;
    
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
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <div className="w-full max-w-5xl z-10 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-5xl md:text-6xl font-orbitron font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
            {t.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        {/* Main Auth Card */}
        <Card className="bg-card/95 backdrop-blur-sm border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-orbitron">{t.subtitle}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* EVE Online Button */}
            <Button
              onClick={handleEveLogin}
              size="lg"
              className="w-full h-auto py-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Rocket className="h-8 w-8" />
                  <div className="text-left">
                    <div className="text-lg font-bold">{t.eveButton}</div>
                    <div className="text-sm opacity-90">{t.eveDesc}</div>
                  </div>
                </div>
              </div>
            </Button>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
              <ShieldCheck className="h-4 w-4" />
              <span>{t.security}</span>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">{t.features.operation}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t.features.operationDesc}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">{t.features.intel}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t.features.intelDesc}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">{t.features.community}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t.features.communityDesc}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
