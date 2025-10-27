import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Fitting {
  id: string;
  ship_type: string;
  role: string;
  eft_fitting: string;
  description: string;
  required_skills: any;
  estimated_cost: number;
  priority: number;
}

interface Tag {
  id: string;
  tag: string;
}

interface DoctrineDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctrineId: string;
  doctrineName: string;
  doctrineDescription: string;
  primaryShip: string;
  difficulty: string;
  estimatedCost: number;
}

export function DoctrineDetailsDialog({
  open,
  onOpenChange,
  doctrineId,
  doctrineName,
  doctrineDescription,
  primaryShip,
  difficulty,
  estimatedCost,
}: DoctrineDetailsDialogProps) {
  const [fittings, setFittings] = useState<Fitting[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { language } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (open && doctrineId) {
      fetchFittings();
      fetchTags();
    }
  }, [open, doctrineId]);

  const fetchFittings = async () => {
    const { data } = await supabase
      .from('ship_fittings')
      .select('*')
      .eq('doctrine_id', doctrineId)
      .order('priority', { ascending: false });

    if (data) {
      setFittings(data);
    }
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from('doctrine_tags')
      .select('*')
      .eq('doctrine_id', doctrineId);

    if (data) {
      setTags(data);
    }
  };

  const copyToClipboard = async (text: string, fittingId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(fittingId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: language === 'en' ? 'Copied!' : 'Скопировано!',
        description: language === 'en' ? 'Fitting copied to clipboard' : 'Фит скопирован в буфер обмена',
      });
    } catch (err) {
      toast({
        title: language === 'en' ? 'Error' : 'Ошибка',
        description: language === 'en' ? 'Failed to copy' : 'Не удалось скопировать',
        variant: 'destructive',
      });
    }
  };

  const formatISK = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B ISK`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)}M ISK`;
    }
    return `${amount.toLocaleString()} ISK`;
  };

  const getDifficultyColor = (diff: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500',
      intermediate: 'bg-yellow-500',
      advanced: 'bg-orange-500',
      expert: 'bg-red-500'
    };
    return colors[diff] || 'bg-gray-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{doctrineName}</DialogTitle>
          <DialogDescription>{doctrineDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-base">
              {primaryShip}
            </Badge>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getDifficultyColor(difficulty)}`} />
              <span className="text-sm capitalize">{difficulty}</span>
            </div>
            <Badge variant="secondary" className="text-base">
              {formatISK(estimatedCost)}
            </Badge>
            {tags.map((tag) => (
              <Badge key={tag.id} variant="default">
                {tag.tag}
              </Badge>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              {language === 'en' ? 'Ship Fittings' : 'Фиты кораблей'}
            </h3>

            {fittings.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                {language === 'en'
                  ? 'No fittings available yet'
                  : 'Фиты пока не добавлены'}
              </Card>
            ) : (
              <Tabs defaultValue={fittings[0]?.id} className="w-full">
                <TabsList className="flex flex-wrap h-auto">
                  {fittings.map((fitting) => (
                    <TabsTrigger key={fitting.id} value={fitting.id}>
                      <div className="flex flex-col items-start">
                        <span>{fitting.ship_type}</span>
                        <span className="text-xs text-muted-foreground">
                          {fitting.role}
                        </span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {fittings.map((fitting) => (
                  <TabsContent key={fitting.id} value={fitting.id} className="space-y-4">
                    <Card className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{fitting.ship_type}</h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {fitting.role} • {formatISK(fitting.estimated_cost)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(fitting.eft_fitting, fitting.id)}
                        >
                          {copiedId === fitting.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {fitting.description && (
                        <p className="text-sm mb-3">{fitting.description}</p>
                      )}

                      <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{fitting.eft_fitting}</pre>
                      </div>
                    </Card>

                    {fitting.required_skills && Array.isArray(fitting.required_skills) && fitting.required_skills.length > 0 && (
                      <Card className="p-4">
                        <h5 className="font-semibold mb-2">
                          {language === 'en' ? 'Required Skills' : 'Требуемые скиллы'}
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                          {fitting.required_skills.map((skill: any, idx: number) => (
                            <div key={idx} className="text-sm">
                              <span>{skill.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {skill.level}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
