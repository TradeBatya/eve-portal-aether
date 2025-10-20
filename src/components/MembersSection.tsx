import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Zap, Trophy } from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Active Community",
    description: "Join a thriving community of dedicated pilots across all time zones",
  },
  {
    icon: Shield,
    title: "Strategic Support",
    description: "Access to alliance infrastructure, resources, and veteran leadership",
  },
  {
    icon: Zap,
    title: "Regular Operations",
    description: "Participate in coordinated fleet operations and special events",
  },
  {
    icon: Trophy,
    title: "Rewarding Content",
    description: "Lucrative opportunities in null-sec space with strong ISK generation",
  },
];

export function MembersSection() {
  return (
    <section id="members" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold mb-4 text-primary">Join Our Ranks</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're a seasoned veteran or a new capsuleer, there's a place for you in Advent Coalition
          </p>
        </div>

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

        <div className="text-center">
          <Card className="bg-card border-primary max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl">Ready to Join?</CardTitle>
              <CardDescription className="text-lg">
                Take the first step towards becoming part of something greater
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Contact us in-game or join our Discord server to begin your application process.
                Our recruitment team is ready to answer any questions you may have.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Apply Now
                </Button>
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Join Discord
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
