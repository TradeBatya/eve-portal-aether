import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { z } from 'zod';

const newsSchema = z.object({
  title_en: z.string().trim().min(1, "English title is required").max(200, "Title must be less than 200 characters"),
  title_ru: z.string().trim().min(1, "Russian title is required").max(200, "Title must be less than 200 characters"),
  description_en: z.string().trim().min(1, "English description is required").max(2000, "Description must be less than 2000 characters"),
  description_ru: z.string().trim().min(1, "Russian description is required").max(2000, "Description must be less than 2000 characters"),
  category_en: z.string().trim().min(1, "English category is required").max(100, "Category must be less than 100 characters"),
  category_ru: z.string().trim().min(1, "Russian category is required").max(100, "Category must be less than 100 characters"),
  image_url: z.string().trim().url("Must be a valid URL").max(500, "URL must be less than 500 characters"),
});

interface News {
  id: string;
  title_en: string;
  title_ru: string;
  description_en: string;
  description_ru: string;
  category_en: string;
  category_ru: string;
  image_url: string;
  date: string;
}

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const t = {
    en: {
      title: 'News Management',
      addNews: 'Add News',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      back: 'Back to Main',
      titleEn: 'Title (English)',
      titleRu: 'Title (Russian)',
      descEn: 'Description (English)',
      descRu: 'Description (Russian)',
      categoryEn: 'Category (English)',
      categoryRu: 'Category (Russian)',
      imageUrl: 'Image URL',
      date: 'Date',
      unauthorized: 'Access denied',
      unauthorizedDesc: 'You do not have permission to access this page',
    },
    ru: {
      title: 'Управление новостями',
      addNews: 'Добавить новость',
      edit: 'Редактировать',
      delete: 'Удалить',
      save: 'Сохранить',
      cancel: 'Отмена',
      back: 'Вернуться на главную',
      titleEn: 'Заголовок (Английский)',
      titleRu: 'Заголовок (Русский)',
      descEn: 'Описание (Английский)',
      descRu: 'Описание (Русский)',
      categoryEn: 'Категория (Английский)',
      categoryRu: 'Категория (Русский)',
      imageUrl: 'URL изображения',
      date: 'Дата',
      unauthorized: 'Доступ запрещен',
      unauthorizedDesc: 'У вас нет прав для доступа к этой странице',
    },
  }[language];

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      loadNews();
    }
  }, [user, isAdmin]);

  const loadNews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setNews(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews) return;

    const { id, date, ...newsData } = editingNews;

    try {
      // Validate input
      const validationResult = newsSchema.safeParse(newsData);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(", ");
        toast({
          title: 'Validation Error',
          description: errors,
          variant: 'destructive',
        });
        return;
      }
      
      if (id) {
        const { error } = await supabase
          .from('news')
          .update(validationResult.data)
          .eq('id', id);

        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Success', description: 'News updated' });
          loadNews();
          setIsDialogOpen(false);
        }
      } else {
        const { error } = await supabase
          .from('news')
          .insert([{
            title_en: validationResult.data.title_en,
            title_ru: validationResult.data.title_ru,
            description_en: validationResult.data.description_en,
            description_ru: validationResult.data.description_ru,
            category_en: validationResult.data.category_en,
            category_ru: validationResult.data.category_ru,
            image_url: validationResult.data.image_url,
          }]);

        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Success', description: 'News created' });
          loadNews();
          setIsDialogOpen(false);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'News deleted' });
      loadNews();
    }
  };

  const openEditDialog = (newsItem?: News) => {
    setEditingNews(newsItem || {
      id: '',
      title_en: '',
      title_ru: '',
      description_en: '',
      description_ru: '',
      category_en: '',
      category_ru: '',
      image_url: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-orbitron font-bold text-primary">{t.title}</h1>
          <div className="flex gap-2">
            <Button onClick={() => openEditDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              {t.addNews}
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid gap-4">
            {news.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{language === 'en' ? item.title_en : item.title_ru}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {language === 'en' ? item.category_en : item.category_ru} • {item.date}
                  </p>
                  <p>{language === 'en' ? item.description_en : item.description_ru}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNews?.id ? t.edit : t.addNews}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title_en">{t.titleEn}</Label>
                <Input
                  id="title_en"
                  value={editingNews?.title_en || ''}
                  onChange={(e) => setEditingNews({ ...editingNews!, title_en: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title_ru">{t.titleRu}</Label>
                <Input
                  id="title_ru"
                  value={editingNews?.title_ru || ''}
                  onChange={(e) => setEditingNews({ ...editingNews!, title_ru: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_en">{t.descEn}</Label>
                <Textarea
                  id="description_en"
                  value={editingNews?.description_en || ''}
                  onChange={(e) => setEditingNews({ ...editingNews!, description_en: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_ru">{t.descRu}</Label>
                <Textarea
                  id="description_ru"
                  value={editingNews?.description_ru || ''}
                  onChange={(e) => setEditingNews({ ...editingNews!, description_ru: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_en">{t.categoryEn}</Label>
                  <Input
                    id="category_en"
                    value={editingNews?.category_en || ''}
                    onChange={(e) => setEditingNews({ ...editingNews!, category_en: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_ru">{t.categoryRu}</Label>
                  <Input
                    id="category_ru"
                    value={editingNews?.category_ru || ''}
                    onChange={(e) => setEditingNews({ ...editingNews!, category_ru: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">{t.imageUrl}</Label>
                <Input
                  id="image_url"
                  value={editingNews?.image_url || ''}
                  onChange={(e) => setEditingNews({ ...editingNews!, image_url: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">{t.date}</Label>
                <Input
                  id="date"
                  type="date"
                  value={editingNews?.date || ''}
                  onChange={(e) => setEditingNews({ ...editingNews!, date: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.cancel}
                </Button>
                <Button type="submit">{t.save}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
