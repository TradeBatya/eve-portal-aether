import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { translations } from "@/translations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { z } from "zod";

const intelSchema = z.object({
  system_name: z.string().min(1, "System name is required").max(100),
  region_name: z.string().max(100).optional(),
  hostiles_count: z.number().min(1).max(1000),
  hostile_corps: z.string().max(500).optional(),
  ship_types: z.string().max(500).optional(),
  activity_type: z.enum(['gateCamp', 'roaming', 'cynoBeacon', 'structure', 'mining', 'ratting', 'other']),
  threat_level: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().max(1000).optional(),
});

interface CreateIntelDialogProps {
  onReportCreated: () => void;
}

export const CreateIntelDialog = ({ onReportCreated }: CreateIntelDialogProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = translations[language];
  const [formData, setFormData] = useState({
    system_name: "",
    region_name: "",
    hostiles_count: "1",
    hostile_corps: "",
    ship_types: "",
    activity_type: "roaming",
    threat_level: "medium",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const validatedData = intelSchema.parse({
        system_name: formData.system_name.trim(),
        region_name: formData.region_name.trim() || undefined,
        hostiles_count: parseInt(formData.hostiles_count),
        hostile_corps: formData.hostile_corps.trim() || undefined,
        ship_types: formData.ship_types.trim() || undefined,
        activity_type: formData.activity_type,
        threat_level: formData.threat_level,
        description: formData.description.trim() || undefined,
      });

      const { error } = await supabase.from("intel_reports").insert({
        reported_by: user.id,
        system_name: validatedData.system_name,
        region_name: validatedData.region_name,
        hostiles_count: validatedData.hostiles_count,
        hostile_corps: validatedData.hostile_corps ? validatedData.hostile_corps.split(',').map(s => s.trim()) : null,
        ship_types: validatedData.ship_types ? validatedData.ship_types.split(',').map(s => s.trim()) : null,
        activity_type: validatedData.activity_type,
        threat_level: validatedData.threat_level,
        description: validatedData.description,
      });

      if (error) throw error;

      // Send Discord notification
      const getThreatColor = (level: string) => {
        const colors: Record<string, number> = {
          low: 0x00FF00,
          medium: 0xFFD700,
          high: 0xFF6B00,
          critical: 0xFF0000,
        };
        return colors[level] || 0x5865F2;
      };

      await supabase.functions.invoke('send-discord-notification', {
        body: {
          payload: {
            type: 'intel',
            title: `⚠️ Intel: ${validatedData.system_name}`,
            description: validatedData.description || (language === "en" ? "Hostile activity detected" : "Обнаружена враждебная активность"),
            color: getThreatColor(validatedData.threat_level),
            fields: [
              { name: language === "en" ? 'System' : 'Система', value: validatedData.system_name, inline: true },
              { name: language === "en" ? 'Threat' : 'Угроза', value: validatedData.threat_level.toUpperCase(), inline: true },
              { name: language === "en" ? 'Activity' : 'Активность', value: validatedData.activity_type, inline: true },
              { name: language === "en" ? 'Hostiles' : 'Враги', value: String(validatedData.hostiles_count), inline: true },
            ],
          }
        }
      }).catch(err => console.error('Failed to send Discord notification:', err));

      // Track achievement progress
      await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_achievement_key: 'first_intel',
        p_increment: 1
      });
      
      await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_achievement_key: 'intel_specialist',
        p_increment: 1
      });

      toast.success(language === "en" ? "Intel report submitted" : "Разведданные отправлены");
      setOpen(false);
      setFormData({
        system_name: "",
        region_name: "",
        hostiles_count: "1",
        hostile_corps: "",
        ship_types: "",
        activity_type: "roaming",
        threat_level: "medium",
        description: "",
      });
      onReportCreated();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(language === "en" ? "Failed to submit report" : "Не удалось отправить отчет");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {language === "en" ? "Report Intel" : "Отправить разведданные"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "en" ? "Submit Intelligence Report" : "Отправить разведывательный отчет"}
          </DialogTitle>
          <DialogDescription>
            {language === "en"
              ? "Report hostile activity to help keep the alliance informed."
              : "Сообщите о враждебной активности, чтобы информировать альянс."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="system_name">
                {language === "en" ? "System Name" : "Система"} *
              </Label>
              <Input
                id="system_name"
                value={formData.system_name}
                onChange={(e) =>
                  setFormData({ ...formData, system_name: e.target.value })
                }
                required
                placeholder="J123456"
              />
            </div>

            <div>
              <Label htmlFor="region_name">
                {language === "en" ? "Region" : "Регион"}
              </Label>
              <Input
                id="region_name"
                value={formData.region_name}
                onChange={(e) =>
                  setFormData({ ...formData, region_name: e.target.value })
                }
                placeholder="Delve"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="threat_level">
                {language === "en" ? "Threat Level" : "Уровень угрозы"} *
              </Label>
              <Select
                value={formData.threat_level}
                onValueChange={(value) =>
                  setFormData({ ...formData, threat_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{language === "en" ? "Low" : "Низкий"}</SelectItem>
                  <SelectItem value="medium">{language === "en" ? "Medium" : "Средний"}</SelectItem>
                  <SelectItem value="high">{language === "en" ? "High" : "Высокий"}</SelectItem>
                  <SelectItem value="critical">{language === "en" ? "Critical" : "Критический"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="activity_type">
                {language === "en" ? "Activity Type" : "Тип активности"} *
              </Label>
              <Select
                value={formData.activity_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, activity_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gateCamp">{language === "en" ? "Gate Camp" : "Гейт-кемп"}</SelectItem>
                  <SelectItem value="roaming">{language === "en" ? "Roaming Gang" : "Роуминг"}</SelectItem>
                  <SelectItem value="cynoBeacon">{language === "en" ? "Cyno Beacon" : "Цино-маяк"}</SelectItem>
                  <SelectItem value="structure">{language === "en" ? "Structure Activity" : "Структуры"}</SelectItem>
                  <SelectItem value="mining">{language === "en" ? "Mining Fleet" : "Майнинг"}</SelectItem>
                  <SelectItem value="ratting">{language === "en" ? "Ratting" : "Раттинг"}</SelectItem>
                  <SelectItem value="other">{language === "en" ? "Other" : "Другое"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="hostiles_count">
              {language === "en" ? "Number of Hostiles" : "Количество врагов"} *
            </Label>
            <Input
              id="hostiles_count"
              type="number"
              min="1"
              value={formData.hostiles_count}
              onChange={(e) =>
                setFormData({ ...formData, hostiles_count: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="hostile_corps">
              {language === "en" ? "Hostile Corporations" : "Враждебные корпорации"}
            </Label>
            <Input
              id="hostile_corps"
              value={formData.hostile_corps}
              onChange={(e) =>
                setFormData({ ...formData, hostile_corps: e.target.value })
              }
              placeholder={language === "en" ? "Corp1, Corp2, Corp3" : "Корп1, Корп2, Корп3"}
            />
          </div>

          <div>
            <Label htmlFor="ship_types">
              {language === "en" ? "Ship Types" : "Типы кораблей"}
            </Label>
            <Input
              id="ship_types"
              value={formData.ship_types}
              onChange={(e) =>
                setFormData({ ...formData, ship_types: e.target.value })
              }
              placeholder={language === "en" ? "Hurricane, Rupture, Stiletto" : "Hurricane, Rupture, Stiletto"}
            />
          </div>

          <div>
            <Label htmlFor="description">
              {language === "en" ? "Additional Details" : "Дополнительная информация"}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={language === "en" 
                ? "Additional information about the hostile activity..." 
                : "Дополнительная информация о враждебной активности..."}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {language === "en" ? "Cancel" : "Отмена"}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? (language === "en" ? "Submitting..." : "Отправка...")
                : (language === "en" ? "Submit Report" : "Отправить отчет")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};