import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const DiscordCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState('Обработка авторизации Discord...');

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        console.error('Discord OAuth error:', error, errorDescription);
        toast({
          title: 'Ошибка авторизации',
          description: errorDescription || 'Не удалось подключить Discord аккаунт',
          variant: 'destructive',
        });
        navigate('/profile');
        return;
      }

      if (!code) {
        toast({
          title: 'Ошибка',
          description: 'Код авторизации не получен',
          variant: 'destructive',
        });
        navigate('/profile');
        return;
      }

      // CSRF validation
      const storedState = sessionStorage.getItem('discord_oauth_state');
      if (!storedState || storedState !== state) {
        toast({
          title: 'Ошибка безопасности',
          description: 'Неверный state параметр',
          variant: 'destructive',
        });
        navigate('/profile');
        return;
      }

      // Clear stored state
      sessionStorage.removeItem('discord_oauth_state');

      if (!user) {
        toast({
          title: 'Ошибка',
          description: 'Пользователь не авторизован',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      try {
        setStatus('Обмен кода на токен...');

        const { data, error: functionError } = await supabase.functions.invoke('discord-auth', {
          body: {
            code,
            state,
            userId: user.id,
          },
        });

        if (functionError) {
          throw functionError;
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Failed to connect Discord');
        }

        toast({
          title: 'Успешно!',
          description: 'Discord аккаунт успешно подключен',
        });

        navigate('/profile');
      } catch (error) {
        console.error('Error in Discord callback:', error);
        toast({
          title: 'Ошибка',
          description: error instanceof Error ? error.message : 'Не удалось подключить Discord',
          variant: 'destructive',
        });
        navigate('/profile');
      }
    };

    handleCallback();
  }, [navigate, user, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

export default DiscordCallback;