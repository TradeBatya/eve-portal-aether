import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import fleetShips from "@/assets/fleet-ships.jpg";
import heroFleet from "@/assets/hero-fleet.webp";
import station from "@/assets/station.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";

const getNewsItems = (t: any) => [
  {
    id: 1,
    title: t.news.title1,
    description: t.news.desc1,
    date: "2024-01-15",
    category: t.news.category1,
    image: fleetShips,
  },
  {
    id: 2,
    title: t.news.title2,
    description: t.news.desc2,
    date: "2024-01-12",
    category: t.news.category2,
    image: heroFleet,
  },
  {
    id: 3,
    title: t.news.title3,
    description: t.news.desc3,
    date: "2024-01-10",
    category: t.news.category3,
    image: station,
  },
];

export function NewsSection() {
  const { language } = useLanguage();
  const t = translations[language];
  const newsItems = getNewsItems(t);
  
  return (
    <section id="news" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center text-primary">
          {t.news.title}
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          {t.news.subtitle}
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsItems.map((item, index) => (
            <Card
              key={item.id}
              className="bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 overflow-hidden group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="border-primary text-primary">
                    {item.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{item.date}</span>
                </div>
                <CardTitle className="text-2xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
