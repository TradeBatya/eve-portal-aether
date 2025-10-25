import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Ship, Map, DollarSign } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

export function DashboardQuickActions() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const actions = [
    {
      label: language === 'en' ? 'Submit SRP' : 'Подать SRP',
      icon: DollarSign,
      onClick: () => {
        toast({
          title: language === 'en' ? 'Coming Soon' : 'Скоро',
          description: language === 'en' ? 'SRP system is under development' : 'Система SRP в разработке'
        });
      }
    },
    {
      label: language === 'en' ? 'View Doctrines' : 'Доктрины',
      icon: Ship,
      onClick: () => {
        toast({
          title: language === 'en' ? 'Coming Soon' : 'Скоро',
          description: language === 'en' ? 'Doctrines database is under development' : 'База доктрин в разработке'
        });
      }
    },
    {
      label: language === 'en' ? 'Intel Map' : 'Intel-карта',
      icon: Map,
      onClick: () => {
        toast({
          title: language === 'en' ? 'Coming Soon' : 'Скоро',
          description: language === 'en' ? 'Intel system is under development' : 'Intel система в разработке'
        });
      }
    },
    {
      label: language === 'en' ? 'Fleet Reports' : 'Отчёты флотов',
      icon: FileText,
      onClick: () => {
        toast({
          title: language === 'en' ? 'Coming Soon' : 'Скоро',
          description: language === 'en' ? 'Reports system is under development' : 'Система отчётов в разработке'
        });
      }
    }
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">
        {language === 'en' ? 'Quick Actions' : 'Быстрые действия'}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={action.onClick}
          >
            <action.icon className="h-6 w-6" />
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}