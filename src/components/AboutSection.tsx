import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import stationImage from "@/assets/station.jpg";

export function AboutSection() {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h2 className="text-5xl font-bold mb-6 text-primary">About Us</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                Advent Coalition stands as one of New Eden's premier alliances, built on the
                foundations of strategic excellence, unwavering loyalty, and shared ambition.
                Operating in the depths of null-security space, we've carved out our territory
                through skill, determination, and coordinated effort.
              </p>
              <p>
                Our members come from diverse backgrounds, united by a common goal: to thrive
                in the harsh environment of Eve Online. We offer comprehensive support for all
                playstyles, from industry and mining operations to PvP combat and exploration.
              </p>
              <p>
                Leadership is experienced and accessible, with a command structure that values
                every member's contribution. We maintain a balance between organized operations
                and the freedom for personal growth, ensuring that every pilot can pursue their
                goals while contributing to our collective success.
              </p>
            </div>
          </div>

          <div className="animate-fade-in">
            <Card className="bg-card border-border overflow-hidden">
              <div className="relative h-96">
                <img
                  src={stationImage}
                  alt="Space Station"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              </div>
              <CardHeader>
                <CardTitle className="text-3xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base space-y-2">
                  <p>
                    To be recognized as the premier destination for pilots seeking both
                    competitive excellence and a supportive community in Eve Online.
                  </p>
                  <p className="text-primary font-semibold mt-4">
                    "Together, we forge our destiny among the stars."
                  </p>
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
