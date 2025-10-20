import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import fleetImage from "@/assets/fleet-ships.jpg";
import stationImage from "@/assets/station.jpg";

const newsItems = [
  {
    id: 1,
    title: "Major Fleet Operation Success",
    description: "Our coalition secured a decisive victory in the recent null-sec campaign, demonstrating exceptional coordination and strategic prowess.",
    date: "2025-01-15",
    category: "Operations",
    image: fleetImage,
  },
  {
    id: 2,
    title: "New Citadel Deployed",
    description: "Successfully anchored a Fortizar-class citadel in strategic territory, expanding our presence and providing new staging opportunities.",
    date: "2025-01-10",
    category: "Infrastructure",
    image: stationImage,
  },
  {
    id: 3,
    title: "Recruitment Drive Opens",
    description: "We're expanding our ranks! Experienced pilots and new capsuleers alike are welcome to apply and join our growing community.",
    date: "2025-01-08",
    category: "Recruitment",
    image: fleetImage,
  },
];

export function NewsSection() {
  return (
    <section id="news" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold mb-4 text-primary">Latest News</h2>
          <p className="text-xl text-muted-foreground">
            Stay updated with our latest operations and announcements
          </p>
        </div>

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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{item.date}</span>
                  </div>
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
