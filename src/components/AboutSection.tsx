import { Card, CardContent } from "@/components/ui/card";
import station from "@/assets/station.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";

export function AboutSection() {
  const { language } = useLanguage();
  const t = translations[language];
  
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center text-primary">
          {t.about.title}
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-6 text-lg text-muted-foreground mb-12">
          <p>
            {t.about.intro}
          </p>
          
          <p>
            {t.about.community}
          </p>
          
          <p>
            {t.about.leadership}
          </p>
        </div>

        <Card className="max-w-4xl mx-auto bg-card/50 backdrop-blur border-primary/20 overflow-hidden">
          <div className="relative h-64">
            <img
              src={station}
              alt="Space Station"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/20" />
            <CardContent className="relative z-10 p-8">
              <h3 className="text-2xl font-bold mb-4 text-primary">{t.about.visionTitle}</h3>
              <p className="text-lg text-primary-foreground/90 italic">
                {t.about.visionQuote}
              </p>
            </CardContent>
          </div>
        </Card>
      </div>
    </section>
  );
}
