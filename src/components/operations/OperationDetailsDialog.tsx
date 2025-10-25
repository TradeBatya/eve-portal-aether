import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Users, Clock, Target, Ship } from "lucide-react";
import { format } from "date-fns";

interface Operation {
  id: string;
  title: string;
  description: string;
  operation_type: string;
  fc_name: string;
  start_time: string;
  duration_minutes: number;
  location: string;
  doctrine: string;
  max_participants: number;
  current_participants: number;
  objectives: string;
}

interface OperationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: Operation;
  onUpdate: () => void;
}

interface Signup {
  id: string;
  role: string;
  ship_type: string;
  user_id: string;
  profiles: {
    display_name: string | null;
  } | null;
}

export function OperationDetailsDialog({ open, onOpenChange, operation, onUpdate }: OperationDetailsDialogProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [signupData, setSignupData] = useState({ role: "", ship_type: "", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSignups();
    }
  }, [open, operation.id]);

  const fetchSignups = async () => {
    const { data } = await supabase
      .from('operation_signups')
      .select('id, role, ship_type, user_id')
      .eq('operation_id', operation.id);

    if (data) {
      // Fetch profile names separately
      const enrichedData = await Promise.all(
        data.map(async (signup) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', signup.user_id)
            .single();
          
          return {
            ...signup,
            profiles: profile
          };
        })
      );
      
      setSignups(enrichedData as any);
      if (user) {
        setIsSignedUp(data.some(s => s.user_id === user.id));
      }
    }
  };

  const handleSignup = async () => {
    if (!user) {
      toast({
        title: language === 'en' ? 'Authentication required' : 'Требуется авторизация',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('operation_signups').insert({
      operation_id: operation.id,
      user_id: user.id,
      role: signupData.role,
      ship_type: signupData.ship_type,
      notes: signupData.notes
    });

    setLoading(false);

    if (error) {
      toast({
        title: language === 'en' ? 'Error' : 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: language === 'en' ? 'Signed up!' : 'Записаны!',
        description: language === 'en' ? 'You are now registered for this operation' : 'Вы зарегистрированы на операцию'
      });
      fetchSignups();
      onUpdate();
    }
  };

  const handleCancelSignup = async () => {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from('operation_signups')
      .delete()
      .eq('operation_id', operation.id)
      .eq('user_id', user.id);

    setLoading(false);

    if (error) {
      toast({
        title: language === 'en' ? 'Error' : 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: language === 'en' ? 'Cancelled' : 'Отменено',
        description: language === 'en' ? 'Your signup has been cancelled' : 'Ваша запись отменена'
      });
      fetchSignups();
      onUpdate();
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pvp: 'destructive',
      pve: 'default',
      mining: 'secondary',
      training: 'outline'
    };
    return colors[type] || 'default';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{operation.title}</DialogTitle>
            <Badge variant={getTypeColor(operation.operation_type) as any}>
              {operation.operation_type.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {operation.description && (
            <p className="text-muted-foreground">{operation.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(operation.start_time), 'PPp')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{operation.duration_minutes} {language === 'en' ? 'minutes' : 'минут'}</span>
            </div>
            {operation.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{operation.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{signups.length}/{operation.max_participants || '∞'} {language === 'en' ? 'pilots' : 'пилотов'}</span>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">{language === 'en' ? 'Fleet Commander' : 'Командир флота'}</h3>
            <p>{operation.fc_name}</p>
          </div>

          {operation.doctrine && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Ship className="h-4 w-4" />
                {language === 'en' ? 'Doctrine' : 'Доктрина'}
              </h3>
              <Badge variant="outline">{operation.doctrine}</Badge>
            </div>
          )}

          {operation.objectives && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                {language === 'en' ? 'Objectives' : 'Цели'}
              </h3>
              <p className="text-sm text-muted-foreground">{operation.objectives}</p>
            </div>
          )}

          <Separator />

          {!isSignedUp && user && (
            <div className="space-y-4 p-4 border border-border rounded-lg">
              <h3 className="font-semibold">{language === 'en' ? 'Sign up for this operation' : 'Записаться на операцию'}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">{language === 'en' ? 'Role' : 'Роль'}</Label>
                  <Input
                    id="role"
                    value={signupData.role}
                    onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                    placeholder={language === 'en' ? 'DPS, Logi, Scout...' : 'DPS, Логист, Скаут...'}
                  />
                </div>
                <div>
                  <Label htmlFor="ship_type">{language === 'en' ? 'Ship Type' : 'Тип корабля'}</Label>
                  <Input
                    id="ship_type"
                    value={signupData.ship_type}
                    onChange={(e) => setSignupData({ ...signupData, ship_type: e.target.value })}
                    placeholder={language === 'en' ? 'e.g., Muninn' : 'например, Muninn'}
                  />
                </div>
              </div>
              <Button onClick={handleSignup} disabled={loading} className="w-full">
                {loading ? (language === 'en' ? 'Signing up...' : 'Запись...') : (language === 'en' ? 'Sign Up' : 'Записаться')}
              </Button>
            </div>
          )}

          {isSignedUp && (
            <div className="p-4 border border-green-500 rounded-lg bg-green-500/10">
              <p className="text-sm text-green-500 font-semibold mb-2">
                {language === 'en' ? 'You are signed up for this operation' : 'Вы записаны на эту операцию'}
              </p>
              <Button variant="outline" onClick={handleCancelSignup} disabled={loading}>
                {loading ? (language === 'en' ? 'Cancelling...' : 'Отмена...') : (language === 'en' ? 'Cancel Signup' : 'Отменить запись')}
              </Button>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-4">
              {language === 'en' ? 'Registered Pilots' : 'Записавшиеся пилоты'} ({signups.length})
            </h3>
            {signups.length === 0 ? (
              <p className="text-sm text-muted-foreground">{language === 'en' ? 'No pilots signed up yet' : 'Пока никто не записался'}</p>
            ) : (
              <div className="space-y-2">
                {signups.map((signup) => (
                  <div key={signup.id} className="flex items-center justify-between p-3 border border-border rounded">
                    <div>
                      <p className="font-medium">{(signup.profiles as any)?.display_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {signup.role && `${signup.role} • `}{signup.ship_type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}