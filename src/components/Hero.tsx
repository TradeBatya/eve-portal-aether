import { Button } from "@/components/ui/button";
import heroFleet from "@/assets/hero-fleet.webp";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";

export function Hero() {
  const { language } = useLanguage();
  const t = translations[language];
  
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Animation */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-zoom"
        style={{ backgroundImage: `url(${heroFleet})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <h1 className="text-6xl md:text-8xl font-orbitron font-black mb-6 animate-fade-in tracking-widest bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,140,0,0.5)] [text-shadow:_0_0_20px_rgb(255_140_0_/_40%)]">
          {t.hero.title}
        </h1>
        <p className="text-2xl md:text-3xl mb-4 animate-fade-in font-rajdhani font-semibold tracking-wide bg-gradient-to-r from-orange-200 via-amber-100 to-orange-200 bg-clip-text text-transparent drop-shadow-lg">
          {t.hero.subtitle}
        </p>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto animate-fade-in text-orange-100/90 font-rajdhani font-light">
          {t.hero.description}
        </p>
        <div className="flex gap-4 justify-center animate-fade-in">
          <Button size="lg" className="text-lg px-8 font-rajdhani font-semibold">
            {t.hero.joinButton}
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 font-rajdhani font-semibold">
            {t.hero.learnButton}
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  );
}
