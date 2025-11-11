import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, TestTube } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Webhook {
  id: string;
  webhook_url: string;
  channel_name: string;
  webhook_type: string;
  is_active: boolean;
  created_at: string;
}

export const WebhookManagement = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    webhook_url: "",
    channel_name: "",
    webhook_type: "general",
  });
  const { toast } = useToast();
  const { language } = useLanguage();

  const t = {
    en: {
      title: "Discord Webhooks",
      description: "Manage Discord webhook integrations for notifications",
      addNew: "Add Webhook",
      channelName: "Channel Name",
      webhookUrl: "Webhook URL",
      type: "Type",
      status: "Status",
      actions: "Actions",
      create: "Create",
      cancel: "Cancel",
      test: "Test",
      delete: "Delete",
      active: "Active",
      inactive: "Inactive",
      types: {
        operations: "Operations",
        intel: "Intel",
        pings: "Pings",
        recruitment: "Recruitment",
        general: "General",
      },
      success: "Success",
      error: "Error",
      webhookCreated: "Webhook created successfully",
      webhookDeleted: "Webhook deleted successfully",
      webhookTested: "Test notification sent",
      webhookToggled: "Webhook status updated",
      fillAllFields: "Please fill all fields",
    },
    ru: {
      title: "Discord Вебхуки",
      description: "Управление интеграцией Discord для уведомлений",
      addNew: "Добавить Вебхук",
      channelName: "Название канала",
      webhookUrl: "URL Вебхука",
      type: "Тип",
      status: "Статус",
      actions: "Действия",
      create: "Создать",
      cancel: "Отмена",
      test: "Тест",
      delete: "Удалить",
      active: "Активен",
      inactive: "Неактивен",
      types: {
        operations: "Операции",
        intel: "Разведка",
        pings: "Пинги",
        recruitment: "Рекрутинг",
        general: "Общие",
      },
      success: "Успешно",
      error: "Ошибка",
      webhookCreated: "Вебхук создан успешно",
      webhookDeleted: "Вебхук удален успешно",
      webhookTested: "Тестовое уведомление отправлено",
      webhookToggled: "Статус вебхука обновлен",
      fillAllFields: "Заполните все поля",
    },
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("discord_webhooks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading webhooks:", error);
      toast({
        title: t[language].error,
        description: error.message,
        variant: "destructive",
      });
    } else {
      setWebhooks(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.webhook_url || !formData.channel_name || !formData.webhook_type) {
      toast({
        title: t[language].error,
        description: t[language].fillAllFields,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("discord_webhooks").insert([formData]);

    if (error) {
      toast({
        title: t[language].error,
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t[language].success,
        description: t[language].webhookCreated,
      });
      setFormData({ webhook_url: "", channel_name: "", webhook_type: "general" });
      setShowForm(false);
      loadWebhooks();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("discord_webhooks").delete().eq("id", id);

    if (error) {
      toast({
        title: t[language].error,
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t[language].success,
        description: t[language].webhookDeleted,
      });
      loadWebhooks();
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("discord_webhooks")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: t[language].error,
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t[language].success,
        description: t[language].webhookToggled,
      });
      loadWebhooks();
    }
  };

  const handleTest = async (webhook: Webhook) => {
    const { error } = await supabase.functions.invoke("send-discord-notification", {
      body: {
        payload: {
          type: webhook.webhook_type,
          title: "🧪 Test Notification",
          description: `This is a test message for ${webhook.channel_name}`,
          color: 0x5865F2,
          fields: [
            { name: "Channel", value: webhook.channel_name, inline: true },
            { name: "Type", value: webhook.webhook_type, inline: true },
          ],
          footer: "EVE Portal Aether",
        },
      },
    });

    if (error) {
      toast({
        title: t[language].error,
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t[language].success,
        description: t[language].webhookTested,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t[language].title}</CardTitle>
              <CardDescription>{t[language].description}</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              {t[language].addNew}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="channel_name">{t[language].channelName}</Label>
                <Input
                  id="channel_name"
                  value={formData.channel_name}
                  onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                  placeholder="announcements"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook_url">{t[language].webhookUrl}</Label>
                <Input
                  id="webhook_url"
                  type="url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook_type">{t[language].type}</Label>
                <Select
                  value={formData.webhook_type}
                  onValueChange={(value) => setFormData({ ...formData, webhook_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{t[language].types.general}</SelectItem>
                    <SelectItem value="operations">{t[language].types.operations}</SelectItem>
                    <SelectItem value="intel">{t[language].types.intel}</SelectItem>
                    <SelectItem value="pings">{t[language].types.pings}</SelectItem>
                    <SelectItem value="recruitment">{t[language].types.recruitment}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{t[language].create}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t[language].cancel}
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{webhook.channel_name}</h4>
                    <Badge variant="outline">{t[language].types[webhook.webhook_type as keyof typeof t.en.types]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate max-w-md">
                    {webhook.webhook_url}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={webhook.is_active}
                    onCheckedChange={() => handleToggle(webhook.id, webhook.is_active)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(webhook)}
                  >
                    <TestTube className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(webhook.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
