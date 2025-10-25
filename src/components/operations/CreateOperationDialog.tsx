import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateOperationDialog({ open, onOpenChange, onSuccess }: CreateOperationDialogProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    operation_type: "pvp",
    fc_name: "",
    start_time: "",
    duration_minutes: 120,
    location: "",
    doctrine: "",
    max_participants: "",
    objectives: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from('fleet_operations').insert([{
      title: formData.title,
      description: formData.description,
      operation_type: formData.operation_type as any,
      fc_name: formData.fc_name,
      start_time: formData.start_time,
      duration_minutes: formData.duration_minutes,
      location: formData.location,
      doctrine: formData.doctrine,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      objectives: formData.objectives,
      created_by: user.id
    }]);

    setLoading(false);

    if (error) {
      toast({
        title: language === 'en' ? 'Error' : 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: language === 'en' ? 'Success' : 'Успешно',
        description: language === 'en' ? 'Operation created successfully' : 'Операция создана'
      });
      onSuccess();
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        operation_type: "pvp",
        fc_name: "",
        start_time: "",
        duration_minutes: 120,
        location: "",
        doctrine: "",
        max_participants: "",
        objectives: ""
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Create Fleet Operation' : 'Создать операцию флота'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' ? 'Schedule a new fleet operation' : 'Запланируйте новую операцию флота'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{language === 'en' ? 'Title' : 'Название'}*</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">{language === 'en' ? 'Description' : 'Описание'}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operation_type">{language === 'en' ? 'Type' : 'Тип'}*</Label>
              <Select value={formData.operation_type} onValueChange={(value) => setFormData({ ...formData, operation_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pvp">PvP</SelectItem>
                  <SelectItem value="pve">PvE</SelectItem>
                  <SelectItem value="mining">{language === 'en' ? 'Mining' : 'Майнинг'}</SelectItem>
                  <SelectItem value="training">{language === 'en' ? 'Training' : 'Обучение'}</SelectItem>
                  <SelectItem value="logistics">{language === 'en' ? 'Logistics' : 'Логистика'}</SelectItem>
                  <SelectItem value="defense">{language === 'en' ? 'Defense' : 'Оборона'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fc_name">{language === 'en' ? 'Fleet Commander' : 'Командир флота'}*</Label>
              <Input
                id="fc_name"
                value={formData.fc_name}
                onChange={(e) => setFormData({ ...formData, fc_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">{language === 'en' ? 'Start Time' : 'Время начала'}*</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration_minutes">{language === 'en' ? 'Duration (minutes)' : 'Длительность (минуты)'}*</Label>
              <Input
                id="duration_minutes"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">{language === 'en' ? 'Location' : 'Локация'}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={language === 'en' ? 'e.g., Jita, Null-Sec' : 'например, Jita, Null-Sec'}
              />
            </div>

            <div>
              <Label htmlFor="doctrine">{language === 'en' ? 'Doctrine' : 'Доктрина'}</Label>
              <Input
                id="doctrine"
                value={formData.doctrine}
                onChange={(e) => setFormData({ ...formData, doctrine: e.target.value })}
                placeholder={language === 'en' ? 'e.g., HAC Fleet' : 'например, HAC Fleet'}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="max_participants">{language === 'en' ? 'Max Participants (optional)' : 'Макс. участников (опционально)'}</Label>
            <Input
              id="max_participants"
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
              placeholder={language === 'en' ? 'Leave empty for unlimited' : 'Оставьте пустым для неограниченного'}
            />
          </div>

          <div>
            <Label htmlFor="objectives">{language === 'en' ? 'Objectives' : 'Цели'}</Label>
            <Textarea
              id="objectives"
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              rows={3}
              placeholder={language === 'en' ? 'Mission objectives and goals' : 'Цели и задачи операции'}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {language === 'en' ? 'Cancel' : 'Отмена'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (language === 'en' ? 'Creating...' : 'Создание...') : (language === 'en' ? 'Create Operation' : 'Создать операцию')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}