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

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-border z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-orbitron">{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
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
