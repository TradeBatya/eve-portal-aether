import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Home, Newspaper, Users, Info, Menu, LogIn, LogOut, Languages, Shield, User, Rocket, Radio, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { translations } from "@/translations";

interface SideNavProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = (t: any) => [
  { title: t.nav.home, icon: Home, href: "#home" },
  { title: t.nav.news, icon: Newspaper, href: "#news" },
  { title: t.nav.members, icon: Users, href: "#members" },
  { title: t.nav.about, icon: Info, href: "#about" },
];

export function SideNav({ isOpen, onToggle }: SideNavProps) {
  const [activeSection, setActiveSection] = useState("home");
  const { language, toggleLanguage } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const t = translations[language];

  const handleNavClick = (href: string) => {
    setActiveSection(href.replace("#", ""));
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Side Navigation */}
      <nav
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50 transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-primary">{t.nav.title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-6 space-y-2">
          {navItems(t).map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.href.replace("#", "");
            return (
              <button
                key={item.title}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </button>
            );
          })}
          
          <button
            onClick={() => { navigate('/operations'); onToggle(); }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted text-foreground transition-all duration-200"
          >
            <Rocket className="h-5 w-5" />
            <span className="font-medium">{language === 'en' ? 'Operations' : 'Операции'}</span>
          </button>
          
          <button
            onClick={() => { navigate('/intel'); onToggle(); }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted text-foreground transition-all duration-200"
          >
            <Radio className="h-5 w-5" />
            <span className="font-medium">{language === 'en' ? 'Intel' : 'Разведка'}</span>
          </button>

          <button
            onClick={() => { navigate('/doctrines'); onToggle(); }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted text-foreground transition-all duration-200"
          >
            <Ship className="h-5 w-5" />
            <span className="font-medium">{language === 'en' ? 'Doctrines' : 'Доктрины'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border space-y-4">
          <Button 
            onClick={toggleLanguage}
            className="w-full flex items-center gap-2"
            variant="outline"
          >
            <Languages className="h-5 w-5" />
            <span>{language === "en" ? "Русский" : "English"}</span>
          </Button>
          
          {user ? (
            <>
              <Button 
                onClick={() => navigate('/profile')}
                className="w-full flex items-center gap-2"
                variant="outline"
              >
                <User className="h-5 w-5" />
                <span>{language === "en" ? "Profile" : "Профиль"}</span>
              </Button>
              {isAdmin && (
                <Button 
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center gap-2"
                  variant="secondary"
                >
                  <Shield className="h-5 w-5" />
                  <span>{language === "en" ? "Admin Panel" : "Админ-панель"}</span>
                </Button>
              )}
              <Button 
                onClick={signOut}
                className="w-full flex items-center gap-2"
                variant="destructive"
              >
                <LogOut className="h-5 w-5" />
                <span>{language === "en" ? "Sign Out" : "Выход"}</span>
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full flex items-center gap-2"
              variant="default"
            >
              <LogIn className="h-5 w-5" />
              <span>{t.nav.authorize}</span>
            </Button>
          )}
          
          <p className="text-sm text-muted-foreground text-center">
            {t.nav.copyright}
          </p>
        </div>
      </nav>

      {/* Toggle Button (fixed) */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          size="icon"
          className="fixed top-6 right-6 z-30 bg-primary hover:bg-primary/90 shadow-lg animate-glow"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
    </>
  );
}
