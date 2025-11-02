import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const EveCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState('Обработка авторизации...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code) {
          throw new Error('Код авторизации не получен');
        }

        setStatus('Получение токена...');

        // Вызов edge function для обмена кода на токен
        const { data, error } = await supabase.functions.invoke('eve-auth', {
          body: { code, state }
        });

        if (error) throw error;

        setStatus('Создание сессии...');

        // Используем сгенерированную ссылку для авторизации
        if (data.session_url) {
          // Извлекаем токены из URL
          const url = new URL(data.session_url);
          const accessToken = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) throw sessionError;
          }
        }

        setStatus('Авторизация успешна! Перенаправление...');
        
        toast({
          title: "Успешная авторизация",
          description: `Добро пожаловать, ${data.character_name}!`,
        });

        setTimeout(() => {
          navigate('/');
        }, 1000);

      } catch (error: any) {
        console.error('EVE Auth error:', error);
        setStatus('Ошибка авторизации');
        
        toast({
          title: "Ошибка авторизации",
          description: error.message || 'Не удалось завершить авторизацию',
          variant: "destructive",
        });

        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <p className="text-lg text-foreground">{status}</p>
      </div>
    </div>
  );
};

export default EveCallback;
