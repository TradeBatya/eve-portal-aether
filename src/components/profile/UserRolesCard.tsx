import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserRole {
  name: string;
  hierarchy_level: number;
  permissions: string[];
  granted_at: string;
  expires_at: string | null;
}

interface UserRolesCardProps {
  userId: string;
}

export function UserRolesCard({ userId }: UserRolesCardProps) {
  const { language } = useLanguage();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    en: {
      title: 'Your Roles & Permissions',
      description: 'Active roles assigned to your account',
      noRoles: 'No roles assigned yet',
      permissions: 'Your Permissions',
      noPermissions: 'No special permissions',
    },
    ru: {
      title: 'Ваши роли и права',
      description: 'Активные роли, назначенные вашей учётной записи',
      noRoles: 'Роли ещё не назначены',
      permissions: 'Ваши права',
      noPermissions: 'Нет специальных прав',
    },
  }[language];

  useEffect(() => {
    loadRolesAndPermissions();
  }, [userId]);

  const loadRolesAndPermissions = async () => {
    setLoading(true);
    try {
      // Load user roles with metadata
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('granted_at, expires_at, roles(name, hierarchy_level, permissions)')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      const mappedRoles: UserRole[] = (userRolesData || [])
        .map((entry) => {
          const roleMeta = entry.roles as {
            name?: string;
            hierarchy_level?: number;
            permissions?: unknown;
          } | null;

          const permissions = Array.isArray(roleMeta?.permissions)
            ? (roleMeta?.permissions as string[])
            : [];

          return {
            name: roleMeta?.name ?? '',
            hierarchy_level: roleMeta?.hierarchy_level ?? 0,
            permissions,
            granted_at: entry.granted_at,
            expires_at: entry.expires_at,
          };
        })
        .filter((role) => role.name.length > 0);

      setUserRoles(mappedRoles);

      // Load user permissions
      const { data: permsData, error: permsError } = await supabase.functions.invoke('manage-roles', {
        body: { action: 'get_permissions' },
      });

      if (!permsError && Array.isArray(permsData?.permissions)) {
        setPermissions(permsData.permissions as string[]);
      }
    } catch (error) {
      console.error('Error loading roles and permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (hierarchyLevel: number) => {
    if (hierarchyLevel >= 90) return 'destructive';
    if (hierarchyLevel >= 70) return 'default';
    if (hierarchyLevel >= 40) return 'secondary';
    return 'outline';
  };

  const permissionLabels: Record<string, { en: string; ru: string }> = {
    'user.manage': { en: 'Manage Users', ru: 'Управление пользователями' },
    'roles.manage': { en: 'Manage Roles', ru: 'Управление ролями' },
    'corporation.manage': { en: 'Manage Corporations', ru: 'Управление корпорациями' },
    'settings.manage': { en: 'Manage Settings', ru: 'Управление настройками' },
    'discord.manage': { en: 'Manage Discord', ru: 'Управление Discord' },
    manage_users: { en: 'Manage Users', ru: 'Управление пользователями' },
    manage_roles: { en: 'Manage Roles', ru: 'Управление ролями' },
    manage_settings: { en: 'Manage Settings', ru: 'Управление настройками' },
    manage_content: { en: 'Manage Content', ru: 'Управление контентом' },
    manage_operations: { en: 'Manage Operations', ru: 'Управление операциями' },
    manage_intel: { en: 'Manage Intel', ru: 'Управление разведкой' },
  };

  const roleLabels: Record<string, { en: string; ru: string }> = {
    super_admin: { en: 'Super Admin', ru: 'Супер администратор' },
    admin: { en: 'Administrator', ru: 'Администратор' },
    moderator: { en: 'Moderator', ru: 'Модератор' },
    corp_director: { en: 'Corporation Director', ru: 'Директор корпорации' },
    corp_member: { en: 'Corporation Member', ru: 'Член корпорации' },
    guest: { en: 'Guest', ru: 'Гость' },
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
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Roles */}
        <div>
          {userRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noRoles}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userRoles.map((userRole) => (
                <Badge
                  key={userRole.name}
                  variant={getRoleBadgeVariant(userRole.hierarchy_level)}
                  className="text-sm px-3 py-1"
                >
                  {roleLabels[userRole.name]?.[language] || userRole.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* User Permissions */}
        {permissions.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3">{t.permissions}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {permissions.map((perm) => (
                <div key={perm} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>{permissionLabels[perm]?.[language] || perm}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {permissions.length === 0 && userRoles.length > 0 && (
          <p className="text-sm text-muted-foreground pt-4 border-t">{t.noPermissions}</p>
        )}
      </CardContent>
    </Card>
  );
}