import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Radio, User, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickActionsWidget() {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const actions = [
    {
      icon: User,
      label: language === "en" ? "My Profile" : "Мой профиль",
      onClick: () => navigate("/profile"),
      variant: "outline" as const,
    },
    {
      icon: Radio,
      label: language === "en" ? "Add Intel" : "Добавить разведданные",
      onClick: () => navigate("/intel"),
      variant: "default" as const,
    },
  ];

  if (isAdmin) {
    actions.push({
      icon: Shield,
      label: language === "en" ? "Admin Panel" : "Админ-панель",
      onClick: () => navigate("/admin"),
      variant: "default" as const,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          {language === "en" ? "Quick Actions" : "Быстрые действия"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant}
              className="w-full justify-start"
            >
              <Icon className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
