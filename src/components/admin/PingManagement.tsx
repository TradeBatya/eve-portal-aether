import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, Trash2, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { z } from 'zod';

const pingSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  message: z.string().trim().min(1, "Message is required").max(1000, "Message must be less than 1000 characters"),
  priority: z.enum(['normal', 'high', 'urgent']),
  expires_hours: z.number().min(1).max(72).optional(),
});

interface Ping {
  id: string;
  title: string;
  message: string;
  priority: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export function PingManagement() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [pings, setPings] = useState<Ping[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'normal',
    expires_hours: '24',
  });

  const t = {
    en: {
      title: 'Ping Management',
      description: 'Create and manage alliance-wide notifications',
      createPing: 'Create Ping',
      pingTitle: 'Title',
      pingMessage: 'Message',
      priority: 'Priority',
      expiresIn: 'Expires In (hours)',
      normal: 'Normal',
      high: 'High',
      urgent: 'Urgent',
      activePings: 'Active Pings',
      noPings: 'No active pings',
      cancel: 'Cancel',
      send: 'Send Ping',
      sending: 'Sending...',
      success: 'Ping sent successfully',
      deleted: 'Ping deleted',
      delete: 'Delete',
      ago: 'ago',
      expires: 'Expires',
    },
    ru: {
      title: 'Управление пингами',
      description: 'Создание и управление уведомлениями альянса',
      createPing: 'Создать пинг',
      pingTitle: 'Заголовок',
      pingMessage: 'Сообщение',
      priority: 'Приоритет',
      expiresIn: 'Истекает через (часы)',
      normal: 'Обычный',
      high: 'Высокий',
      urgent: 'Срочный',
      activePings: 'Активные пинги',
      noPings: 'Нет активных пингов',
      cancel: 'Отмена',
      send: 'Отправить пинг',
      sending: 'Отправка...',
      success: 'Пинг успешно отправлен',
      deleted: 'Пинг удален',
      delete: 'Удалить',
      ago: 'назад',
      expires: 'Истекает',
    },
  }[language];

  useEffect(() => {
    loadPings();

    const channel = supabase
      .channel('ping-management')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ping_notifications' }, () => {
        loadPings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ping_notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setPings(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const validationResult = pingSchema.safeParse({
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        expires_hours: formData.expires_hours ? parseInt(formData.expires_hours) : undefined,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(", ");
        toast({
          title: 'Validation Error',
          description: errors,
          variant: 'destructive',
        });
        setCreating(false);
        return;
      }

      const expiresAt = validationResult.data.expires_hours
        ? new Date(Date.now() + validationResult.data.expires_hours * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('ping_notifications')
        .insert({
          title: validationResult.data.title,
          message: validationResult.data.message,
          priority: validationResult.data.priority,
          expires_at: expiresAt,
        });

      if (error) throw error;

      toast({
        title: t.success,
      });

      setFormData({ title: '', message: '', priority: 'normal', expires_hours: '24' });
      setShowForm(false);
      loadPings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('ping_notifications')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t.deleted,
      });
      loadPings();
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.createPing}
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">{t.pingTitle}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">{t.pingMessage}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">{t.priority}</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{t.normal}</SelectItem>
                      <SelectItem value="high">{t.high}</SelectItem>
                      <SelectItem value="urgent">{t.urgent}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expires_hours">{t.expiresIn}</Label>
                  <Input
                    id="expires_hours"
                    type="number"
                    min="1"
                    max="72"
                    value={formData.expires_hours}
                    onChange={(e) => setFormData({ ...formData, expires_hours: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.sending}
                    </>
                  ) : (
                    t.send
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.activePings}</CardTitle>
        </CardHeader>
        <CardContent>
          {pings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t.noPings}</p>
          ) : (
            <div className="space-y-3">
              {pings.map((ping) => (
                <div
                  key={ping.id}
                  className="p-4 border border-border rounded-lg flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{ping.title}</h4>
                      <Badge variant={getPriorityVariant(ping.priority)}>
                        {ping.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{ping.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(ping.created_at), { addSuffix: true })}
                      </span>
                      {ping.expires_at && (
                        <span>
                          {t.expires} {formatDistanceToNow(new Date(ping.expires_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ping.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
