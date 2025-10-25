import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SideNav } from "@/components/SideNav";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, Filter, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CreateOperationDialog } from "@/components/operations/CreateOperationDialog";
import { OperationDetailsDialog } from "@/components/operations/OperationDetailsDialog";

interface Operation {
  id: string;
  title: string;
  description: string;
  operation_type: string;
  status: string;
  fc_name: string;
  start_time: string;
  duration_minutes: number;
  location: string;
  doctrine: string;
  max_participants: number;
  current_participants: number;
  objectives: string;
}

const Operations = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [filteredOps, setFilteredOps] = useState<Operation[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    fetchOperations();

    const channel = supabase
      .channel('operations-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_operations' }, () => {
        fetchOperations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterOperations();
  }, [operations, selectedType]);

  const fetchOperations = async () => {
    const { data } = await supabase
      .from('fleet_operations')
      .select('*')
      .in('status', ['scheduled', 'ongoing'])
      .order('start_time', { ascending: true });

    if (data) {
      setOperations(data);
    }
  };

  const filterOperations = () => {
    if (selectedType === "all") {
      setFilteredOps(operations);
    } else {
      setFilteredOps(operations.filter(op => op.operation_type === selectedType));
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pvp: 'destructive',
      pve: 'default',
      mining: 'secondary',
      training: 'outline',
      logistics: 'default',
      defense: 'destructive'
    };
    return colors[type] || 'default';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ongoing') {
      return <Badge variant="default" className="bg-green-500">{language === 'en' ? 'LIVE' : 'В ЭФИРЕ'}</Badge>;
    }
    return null;
  };

  const openDetails = (op: Operation) => {
    setSelectedOp(op);
    setIsDetailsOpen(true);
  };

  const tabs = [
    { value: 'all', label: language === 'en' ? 'All' : 'Все' },
    { value: 'pvp', label: 'PvP' },
    { value: 'pve', label: 'PvE' },
    { value: 'mining', label: language === 'en' ? 'Mining' : 'Майнинг' },
    { value: 'training', label: language === 'en' ? 'Training' : 'Обучение' },
    { value: 'logistics', label: language === 'en' ? 'Logistics' : 'Логистика' },
    { value: 'defense', label: language === 'en' ? 'Defense' : 'Оборона' }
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <SideNav isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />
      
      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {language === 'en' ? 'Fleet Operations' : 'Операции флота'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'en' ? 'View and join upcoming fleet operations' : 'Просматривайте и записывайтесь на операции'}
            </p>
          </div>
          
          {isAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Create Operation' : 'Создать операцию'}
            </Button>
          )}
        </div>

        <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-6">
          <TabsList className="flex flex-wrap h-auto">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredOps.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'en' ? 'No operations found' : 'Операций не найдено'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'en' ? 'Check back later or try a different filter' : 'Попробуйте другой фильтр или загляните позже'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOps.map((op) => (
              <Card key={op.id} className="p-6 hover:border-primary transition-colors cursor-pointer" onClick={() => openDetails(op)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{op.title}</h3>
                      {getStatusBadge(op.status)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{op.description}</p>
                  </div>
                  <Badge variant={getTypeColor(op.operation_type) as any}>
                    {op.operation_type.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(op.start_time), 'PPp')}
                    <span className="text-xs">({op.duration_minutes} {language === 'en' ? 'min' : 'мин'})</span>
                  </div>
                  
                  {op.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {op.location}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {op.current_participants}/{op.max_participants || '∞'} {language === 'en' ? 'pilots' : 'пилотов'}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-medium">FC: {op.fc_name}</span>
                  {op.doctrine && (
                    <Badge variant="outline">{op.doctrine}</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {isAdmin && (
        <CreateOperationDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen}
          onSuccess={fetchOperations}
        />
      )}

      {selectedOp && (
        <OperationDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          operation={selectedOp}
          onUpdate={fetchOperations}
        />
      )}
    </div>
  );
};

export default Operations;