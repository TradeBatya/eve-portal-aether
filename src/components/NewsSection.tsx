import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  id: string;
  title_en: string;
  title_ru: string;
  description_en: string;
  description_ru: string;
  category_en: string;
  category_ru: string;
  image_url: string;
  date: string;
}

export function NewsSection() {
  const { language } = useLanguage();
  const t = translations[language];
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      setNewsItems(data);
    }
    setLoading(false);
  };
  
  return (
    <section id="news" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center text-primary">
          {t.news.title}
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          {t.news.subtitle}
        </p>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsItems.map((item, index) => (
              <Card
                key={item.id}
                className="bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 overflow-hidden group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={language === 'en' ? item.title_en : item.title_ru}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="border-primary text-primary">
                      {language === 'en' ? item.category_en : item.category_ru}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{item.date}</span>
                  </div>
                  <CardTitle className="text-2xl">
                    {language === 'en' ? item.title_en : item.title_ru}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {language === 'en' ? item.description_en : item.description_ru}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
