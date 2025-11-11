import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

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
        // Check if this is adding to existing account
        const isAddingCharacter = state && state.startsWith('add_character_');
        const userId = isAddingCharacter ? state.replace('add_character_', '') : null;

        const { data, error } = await supabase.functions.invoke('eve-auth', {
          body: { code, state, userId }
        });

        if (error) throw error;

        // If adding character to existing account
        if (isAddingCharacter && data.success) {
          setStatus('Персонаж добавлен! Перенаправление...');
          
          toast({
            title: "Персонаж добавлен",
            description: `${data.character_name} успешно привязан к аккаунту!`,
          });

          setTimeout(() => {
            navigate('/profile');
          }, 1000);
          return;
        }

        setStatus('Создание сессии...');

        // Используем сгенерированную ссылку для авторизации
        if (data.session_url) {
          // Извлекаем токены из URL
          const url = new URL(data.session_url);
          const accessToken = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) throw sessionError;

            // Дожидаемся подтверждения сессии
            if (sessionData?.session) {
              setStatus('Авторизация успешна! Перенаправление в профиль...');
              
              toast({
                title: "Успешная авторизация",
                description: `Добро пожаловать, ${data.character_name}!`,
              });

              // Даем время AuthContext обновиться
              await new Promise(resolve => setTimeout(resolve, 500));
              
              navigate('/profile');
              return;
            }
          }
        }

        throw new Error('Не удалось создать сессию');

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
      <LanguageSwitcher />
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <p className="text-lg text-foreground">{status}</p>
      </div>
    </div>
  );
};

export default EveCallback;
