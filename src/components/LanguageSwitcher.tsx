import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      size="sm"
      className="fixed top-6 left-6 z-50 bg-card/95 backdrop-blur-sm hover:bg-card shadow-lg border-2"
    >
      <Languages className="h-4 w-4 mr-2" />
      <span className="font-medium">{language === 'en' ? 'RU' : 'EN'}</span>
    </Button>
  );
}
