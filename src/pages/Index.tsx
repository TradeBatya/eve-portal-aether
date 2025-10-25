import { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { Hero } from "@/components/Hero";
import { NewsSection } from "@/components/NewsSection";
import { MembersSection } from "@/components/MembersSection";
import { AboutSection } from "@/components/AboutSection";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { DashboardPings } from "@/components/dashboard/DashboardPings";
import { DashboardOperations } from "@/components/dashboard/DashboardOperations";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { translations } from "@/translations";

const Index = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <SideNav isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />
      
      <main className="relative z-10">
        <Hero />
        
        {user && (
          <section className="container mx-auto px-6 py-12 space-y-6">
            <h2 className="text-3xl font-bold mb-6">
              {language === 'en' ? 'Command Center' : 'Командный центр'}
            </h2>
            
            <DashboardStats />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardPings />
              <DashboardQuickActions />
            </div>
            
            <DashboardOperations />
          </section>
        )}
        
        <NewsSection />
        <MembersSection />
        <AboutSection />
      </main>

      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>{t.footer.copyright}</p>
          <p className="text-sm mt-2">{t.footer.tagline}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
