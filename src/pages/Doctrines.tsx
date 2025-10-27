import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SideNav } from "@/components/SideNav";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ship, Search, Filter, Plus, Shield, Anchor, Heart, EyeOff, Truck, Zap, Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DoctrineDetailsDialog } from "@/components/doctrines/DoctrineDetailsDialog";
import { CreateDoctrineDialog } from "@/components/doctrines/CreateDoctrineDialog";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

interface Doctrine {
  id: string;
  name: string;
  description: string;
  category_id: string;
  primary_ship: string;
  fleet_type: string;
  difficulty: string;
  estimated_cost: number;
  image_url: string;
  is_active: boolean;
}

const Doctrines = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [doctrines, setDoctrines] = useState<Doctrine[]>([]);
  const [filteredDoctrines, setFilteredDoctrines] = useState<Doctrine[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctrine, setSelectedDoctrine] = useState<Doctrine | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchDoctrines();
  }, []);

  useEffect(() => {
    filterDoctrines();
  }, [doctrines, selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('doctrine_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (data) {
      setCategories(data);
    }
  };

  const fetchDoctrines = async () => {
    const { data } = await supabase
      .from('ship_doctrines')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (data) {
      setDoctrines(data);
    }
  };

  const filterDoctrines = () => {
    let filtered = doctrines;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(d => d.category_id === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.primary_ship.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query)
      );
    }

    setFilteredDoctrines(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500',
      intermediate: 'bg-yellow-500',
      advanced: 'bg-orange-500',
      expert: 'bg-red-500'
    };
    return colors[difficulty] || 'bg-gray-500';
  };

  const formatISK = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B ISK`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)}M ISK`;
    }
    return `${amount.toLocaleString()} ISK`;
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      shield: Shield,
      anchor: Anchor,
      heart: Heart,
      'eye-off': EyeOff,
      truck: Truck,
      zap: Zap,
      wind: Wind
    };
    return icons[iconName] || Ship;
  };

  const openDetails = (doctrine: Doctrine) => {
    setSelectedDoctrine(doctrine);
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <SideNav isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />

      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {language === 'en' ? 'Fleet Doctrines' : 'Доктрины флота'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'en'
                ? 'Browse our approved ship doctrines and fittings'
                : 'Просмотрите утвержденные доктрины и фиты кораблей'}
            </p>
          </div>

          {isAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Add Doctrine' : 'Добавить доктрину'}
            </Button>
          )}
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'en' ? 'Search doctrines...' : 'Поиск доктрин...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="all">
              {language === 'en' ? 'All' : 'Все'}
            </TabsTrigger>
            {categories.map((cat) => {
              const IconComponent = getIconComponent(cat.icon);
              return (
                <TabsTrigger key={cat.id} value={cat.id}>
                  <IconComponent className="h-4 w-4 mr-2" />
                  {cat.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {filteredDoctrines.length === 0 ? (
          <Card className="p-12 text-center">
            <Ship className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'en' ? 'No doctrines found' : 'Доктрины не найдены'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'en'
                ? 'Try adjusting your search or filters'
                : 'Попробуйте изменить поиск или фильтры'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctrines.map((doctrine) => (
              <Card
                key={doctrine.id}
                className="overflow-hidden hover:border-primary transition-colors cursor-pointer group"
                onClick={() => openDetails(doctrine)}
              >
                {doctrine.image_url && (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={doctrine.image_url}
                      alt={doctrine.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold">{doctrine.name}</h3>
                    <div className={`w-2 h-2 rounded-full ${getDifficultyColor(doctrine.difficulty)}`} />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{doctrine.primary_ship}</Badge>
                    {doctrine.fleet_type && (
                      <Badge variant="secondary">{doctrine.fleet_type}</Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {doctrine.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {doctrine.difficulty}
                    </span>
                    <span className="font-semibold text-primary">
                      {formatISK(doctrine.estimated_cost)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {isAdmin && (
        <CreateDoctrineDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={fetchDoctrines}
        />
      )}

      {selectedDoctrine && (
        <DoctrineDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          doctrineId={selectedDoctrine.id}
          doctrineName={selectedDoctrine.name}
          doctrineDescription={selectedDoctrine.description || ''}
          primaryShip={selectedDoctrine.primary_ship}
          difficulty={selectedDoctrine.difficulty}
          estimatedCost={selectedDoctrine.estimated_cost}
        />
      )}
    </div>
  );
};

export default Doctrines;
