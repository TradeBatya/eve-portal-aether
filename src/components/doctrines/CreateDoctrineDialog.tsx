import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

interface CreateDoctrineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateDoctrineDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateDoctrineDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    primary_ship: '',
    fleet_type: '',
    difficulty: 'intermediate',
    estimated_cost: 0,
    image_url: '',
  });

  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('doctrine_categories')
      .select('id, name')
      .order('sort_order', { ascending: true });

    if (data) {
      setCategories(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('ship_doctrines')
        .insert({
          ...formData,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Success!' : 'Успешно!',
        description: language === 'en' ? 'Doctrine created' : 'Доктрина создана',
      });

      setFormData({
        name: '',
        description: '',
        category_id: '',
        primary_ship: '',
        fleet_type: '',
        difficulty: 'intermediate',
        estimated_cost: 0,
        image_url: '',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Create New Doctrine' : 'Создать новую доктрину'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en'
              ? 'Add a new fleet doctrine to the database'
              : 'Добавить новую доктрину флота в базу данных'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {language === 'en' ? 'Doctrine Name' : 'Название доктрины'} *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Muninn Fleet"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {language === 'en' ? 'Description' : 'Описание'}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={language === 'en' ? 'Describe the doctrine...' : 'Описание доктрины...'}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                {language === 'en' ? 'Category' : 'Категория'}
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Select category' : 'Выберите категорию'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_ship">
                {language === 'en' ? 'Primary Ship' : 'Основной корабль'} *
              </Label>
              <Input
                id="primary_ship"
                value={formData.primary_ship}
                onChange={(e) => setFormData({ ...formData, primary_ship: e.target.value })}
                placeholder="e.g., Muninn"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fleet_type">
                {language === 'en' ? 'Fleet Type' : 'Тип флота'}
              </Label>
              <Input
                id="fleet_type"
                value={formData.fleet_type}
                onChange={(e) => setFormData({ ...formData, fleet_type: e.target.value })}
                placeholder="e.g., Shield"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">
                {language === 'en' ? 'Difficulty' : 'Сложность'}
              </Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_cost">
                {language === 'en' ? 'Estimated Cost (ISK)' : 'Примерная стоимость (ISK)'}
              </Label>
              <Input
                id="estimated_cost"
                type="number"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({ ...formData, estimated_cost: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">
                {language === 'en' ? 'Image URL' : 'URL изображения'}
              </Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {language === 'en' ? 'Cancel' : 'Отмена'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? (language === 'en' ? 'Creating...' : 'Создание...')
                : (language === 'en' ? 'Create Doctrine' : 'Создать доктрину')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
