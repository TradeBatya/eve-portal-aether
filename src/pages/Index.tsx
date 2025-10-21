import { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { Hero } from "@/components/Hero";
import { NewsSection } from "@/components/NewsSection";
import { MembersSection } from "@/components/MembersSection";
import { AboutSection } from "@/components/AboutSection";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";

function IndexContent() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <SideNav isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />
      
      <main className="relative z-10">
        <Hero />
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
}

const Index = () => {
  return (
    <LanguageProvider>
      <IndexContent />
    </LanguageProvider>
  );
};

export default Index;
