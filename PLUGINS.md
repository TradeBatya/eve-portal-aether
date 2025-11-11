# EVE Portal Plugin System

## Обзор

Система плагинов EVE Portal позволяет расширять функциональность портала модульным способом. Плагины могут добавлять новые виджеты, интеграции с ESI API и пользовательские функции.

## Архитектура

### База данных

#### Таблица `plugins`
Хранит информацию о всех доступных плагинах:
- `id` - UUID плагина
- `plugin_id` - Уникальный текстовый идентификатор
- `name` - Название плагина
- `version` - Версия плагина
- `description` - Описание функционала
- `author` - Автор плагина
- `enabled` - Доступен ли плагин для установки
- `is_system` - Системный плагин (не может быть удалён)
- `metadata` - Дополнительная информация (scopes, иконка и т.д.)

#### Таблица `user_plugins`
Управляет установленными плагинами пользователей:
- `id` - UUID записи
- `user_id` - ID пользователя
- `plugin_id` - ID плагина
- `enabled` - Активен ли плагин
- `settings` - Пользовательские настройки плагина
- `installed_at` - Дата установки

### ESI API Integration

Хук `useEsiApi` предоставляет унифицированный доступ к EVE Online ESI API:

```typescript
const { fetchEsi, loading, error } = useEsiApi();

// Пример использования
const data = await fetchEsi('/characters/{character_id}/', {
  characterId: 12345,
  accessToken: 'token',
  cacheTime: 300000
});
```

Встроенные специализированные хуки:
- `useCharacterInfo` - Информация о персонаже
- `useCharacterSkills` - Навыки персонажа
- `useCharacterSkillQueue` - Очередь обучения навыков
- `useCharacterWallet` - Кошелёк персонажа
- `useCorporationInfo` - Информация о корпорации
- `useAllianceInfo` - Информация об альянсе

## Базовые плагины

### 1. Character Overview
**Plugin ID:** `character-overview`

Отображает основную информацию о персонаже:
- Портрет и имя персонажа
- Корпорация и альянс
- Статус безопасности
- Баланс кошелька
- Текущая локация
- Текущий корабль
- Список всех персонажей аккаунта

**Требуемые scopes:**
- `esi-characters.read_characters.v1`

### 2. Skill Monitor
**Plugin ID:** `skill-monitor`

Мониторинг обучения навыков:
- Текущий обучаемый навык с прогресс-баром
- Время до завершения обучения
- Полная очередь навыков
- Общее время обучения очереди
- Статистика по очкам навыков

**Требуемые scopes:**
- `esi-skills.read_skills.v1`
- `esi-skills.read_skillqueue.v1`

### 3. Wallet Tracker
**Plugin ID:** `wallet-tracker`

Отслеживание финансов:
- Текущий баланс ISK
- Общий доход
- Общие расходы
- История последних транзакций
- Визуализация входящих/исходящих средств

**Требуемые scopes:**
- `esi-wallet.read_character_wallet.v1`

## Использование плагинов

### Для пользователей

1. Перейдите в раздел "Плагины" (Plugins)
2. Просмотрите доступные плагины
3. Нажмите "Установить" для желаемого плагина
4. Плагин появится на вашей панели управления
5. Используйте переключатель для включения/отключения
6. Нажмите "Удалить" для деинсталляции

### Для разработчиков

#### Создание нового плагина

1. **Создайте компонент плагина:**

```tsx
// src/components/plugins/MyPlugin.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export const MyPlugin = () => {
  const { user } = useAuth();
  const { language } = useLanguage();

  const t = {
    en: { title: "My Plugin" },
    ru: { title: "Мой плагин" }
  }[language];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Содержимое плагина */}
      </CardContent>
    </Card>
  );
};
```

2. **Добавьте плагин в базу данных:**

```sql
INSERT INTO public.plugins (
  plugin_id, 
  name, 
  author, 
  description, 
  version, 
  enabled, 
  is_system, 
  metadata
) VALUES (
  'my-plugin',
  'My Plugin',
  'Your Name',
  'Plugin description',
  '1.0.0',
  true,
  false,
  '{"scopes": ["esi-scope-here"], "icon": "IconName"}'::jsonb
);
```

3. **Добавьте рендеринг в PluginsWidget:**

```tsx
// src/components/dashboard/PluginsWidget.tsx
import { MyPlugin } from "@/components/plugins/MyPlugin";

const renderPlugin = (pluginId: string) => {
  switch (pluginId) {
    case 'my-plugin':
      return <MyPlugin key={pluginId} />;
    // ... остальные плагины
  }
};
```

#### Работа с ESI API

```tsx
import { useEsiApi } from "@/hooks/useEsiApi";

export const MyPlugin = () => {
  const { fetchEsi, loading, error } = useEsiApi();
  
  const loadData = async () => {
    try {
      const data = await fetchEsi('/endpoint/', {
        characterId: 12345,
        accessToken: 'token'
      });
      // Обработка данных
    } catch (err) {
      console.error('ESI Error:', err);
    }
  };
  
  return (
    // JSX
  );
};
```

## Безопасность

### RLS Policies

Все таблицы плагинов защищены Row-Level Security:

**Plugins:**
- Любой может просматривать активные плагины
- Только админы могут управлять плагинами

**User Plugins:**
- Пользователи видят только свои плагины
- Пользователи могут устанавливать/удалять только свои плагины
- Пользователи могут изменять настройки только своих плагинов

### ESI Token Security

- Токены доступа хранятся в таблице `eve_characters`
- Токены автоматически обновляются при истечении
- Никогда не передавайте токены на клиент напрямую
- Используйте хук `useEsiApi` для безопасных запросов

## Best Practices

1. **Производительность:**
   - Используйте кеширование для ESI запросов
   - Устанавливайте разумные staleTime для react-query
   - Избегайте частых запросов к ESI

2. **UX:**
   - Показывайте загрузку (Loader) во время запросов
   - Обрабатывайте ошибки с понятными сообщениями
   - Поддерживайте русский и английский языки

3. **Дизайн:**
   - Используйте semantic tokens из design system
   - Следуйте существующим паттернам компонентов
   - Используйте компоненты из shadcn/ui

4. **Код:**
   - Типизируйте все данные с TypeScript
   - Используйте существующие хуки и утилиты
   - Документируйте сложную логику

## Roadmap

Планируемые улучшения:
- [ ] Marketplace для пользовательских плагинов
- [ ] Drag-and-drop для изменения порядка плагинов
- [ ] Настраиваемые размеры виджетов
- [ ] Экспорт/импорт конфигураций плагинов
- [ ] Webhook интеграции
- [ ] Scheduled tasks для плагинов
- [ ] Plugin API с версионированием
- [ ] Тестовый sandbox для разработки плагинов

## Поддержка

По вопросам разработки плагинов обращайтесь:
- GitHub Issues: [ссылка на репозиторий]
- Discord: [ссылка на сервер]
- Email: support@example.com
