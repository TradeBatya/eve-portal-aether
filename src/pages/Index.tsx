import { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { Hero } from "@/components/Hero";
import { NewsSection } from "@/components/NewsSection";
import { MembersSection } from "@/components/MembersSection";
import { AboutSection } from "@/components/AboutSection";

const Index = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SideNav isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />
      
      <main>
        <Hero />
        <NewsSection />
        <MembersSection />
        <AboutSection />
      </main>

      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>© 2025 Advent Coalition. All rights reserved.</p>
          <p className="text-sm mt-2">New Eden awaits. Will you answer the call?</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
