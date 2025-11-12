import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/translations';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { EsiStatus } from '@/components/developer/EsiStatus';
import { DiscordStatus } from '@/components/developer/DiscordStatus';

export default function Developer() {
  const { user, loading, isAdmin } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = translations[language];

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {language === 'en' ? 'Loading...' : 'Загрузка...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Back' : 'Назад'}
          </Button>
          <h1 className="text-4xl font-bold mb-2">
            {language === 'en' ? 'Developer Panel' : 'Панель разработчика'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'Monitor system integrations and API statuses' 
              : 'Мониторинг интеграций системы и статусов API'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EsiStatus />
          <DiscordStatus />
        </div>
      </div>
    </div>
  );
}
