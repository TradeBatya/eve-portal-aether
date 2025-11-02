import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = {
    en: {
      title: 'Authorization',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      signInButton: 'Sign In',
      signUpButton: 'Create Account',
      signInDesc: 'Enter your credentials to access your account',
      signUpDesc: 'Create a new account to join Advent Coalition',
      eveLogin: 'Advent Coalition Alliance Auth',
      orDivider: 'OR',
    },
    ru: {
      title: 'Авторизация',
      signIn: 'Вход',
      signUp: 'Регистрация',
      email: 'Email',
      password: 'Пароль',
      signInButton: 'Войти',
      signUpButton: 'Создать аккаунт',
      signInDesc: 'Введите свои данные для входа',
      signUpDesc: 'Создайте новый аккаунт для вступления в Advent Coalition',
      eveLogin: 'Advent Coalition Alliance Auth',
      orDivider: 'ИЛИ',
    },
  }[language];

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signUp(email, password);
    setLoading(false);
  };

  const handleEveLogin = () => {
    const clientId = '9b9086e27f4940d8a8c64c2881944375';
    const redirectUri = `${window.location.origin}/auth/eve/callback`;
    const state = Math.random().toString(36).substring(7);
    
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

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-border z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-orbitron">{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Button 
              onClick={handleEveLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
              size="lg"
            >
              {t.eveLogin}
            </Button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t.orDivider}</span>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t.signIn}</TabsTrigger>
              <TabsTrigger value="signup">{t.signUp}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <CardDescription className="text-center mb-4">
                  {t.signInDesc}
                </CardDescription>
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t.email}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t.password}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '...' : t.signInButton}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <CardDescription className="text-center mb-4">
                  {t.signUpDesc}
                </CardDescription>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t.email}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t.password}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '...' : t.signUpButton}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
