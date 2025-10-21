import { Shield, Target, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";

const getBenefits = (t: any) => [
  {
    icon: Shield,
    title: t.members.benefit1Title,
    description: t.members.benefit1Desc,
  },
  {
    icon: Target,
    title: t.members.benefit2Title,
    description: t.members.benefit2Desc,
  },
  {
    icon: Users,
    title: t.members.benefit3Title,
    description: t.members.benefit3Desc,
  },
  {
    icon: GraduationCap,
    title: t.members.benefit4Title,
    description: t.members.benefit4Desc,
  },
];

export function MembersSection() {
  const { language } = useLanguage();
  const t = translations[language];
  const benefits = getBenefits(t);
  
  return (
    <section id="members" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center text-primary">
          {t.members.title}
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          {t.members.subtitle}
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={benefit.title}
                className="bg-card border-border hover:border-primary transition-all duration-300 text-center"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="col-span-full bg-card/80 backdrop-blur border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-primary">{t.members.ctaTitle}</CardTitle>
            <CardDescription className="text-lg">
              {t.members.ctaDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 justify-center">
            <Button size="lg" className="text-lg">
              {t.members.applyButton}
            </Button>
            <Button size="lg" variant="outline" className="text-lg">
              {t.members.discordButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
