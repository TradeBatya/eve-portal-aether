import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, UserPlus, UserMinus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserWithRoles {
  id: string;
  display_name: string | null;
  discord_username: string | null;
  created_at: string;
  roles: Array<{
    name: string;
    hierarchy_level: number;
    granted_at: string;
    expires_at: string | null;
  }>;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  hierarchy_level: number;
  permissions: string[];
}

export function RoleManagement() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const t = {
    en: {
      title: 'Role Management',
      description: 'Manage user roles and permissions',
      loadingUsers: 'Loading users...',
      userName: 'User',
      currentRoles: 'Current Roles',
      assignRole: 'Assign Role',
      revokeRole: 'Revoke',
      selectRole: 'Select a role',
      noRoles: 'No roles assigned',
      roleGranted: 'Role granted successfully',
      roleRevoked: 'Role revoked successfully',
    },
    ru: {
      title: 'Управление ролями',
      description: 'Управление ролями и правами пользователей',
      loadingUsers: 'Загрузка пользователей...',
      userName: 'Пользователь',
      currentRoles: 'Текущие роли',
      assignRole: 'Назначить роль',
      revokeRole: 'Отозвать',
      selectRole: 'Выберите роль',
      noRoles: 'Роли не назначены',
      roleGranted: 'Роль успешно назначена',
      roleRevoked: 'Роль успешно отозвана',
    },
  }[language];

  const roleLabels: Record<string, { en: string; ru: string }> = {
    super_admin: { en: 'Super Admin', ru: 'Супер администратор' },
    admin: { en: 'Administrator', ru: 'Администратор' },
    moderator: { en: 'Moderator', ru: 'Модератор' },
    corp_director: { en: 'Corporation Director', ru: 'Директор корпорации' },
    corp_member: { en: 'Corporation Member', ru: 'Член корпорации' },
    guest: { en: 'Guest', ru: 'Гость' },
  };

  useEffect(() => {
    loadData();
  }, [language]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, name, description, hierarchy_level, permissions')
        .order('hierarchy_level', { ascending: false });

      if (rolesError) throw rolesError;
      const mappedRoles: Role[] = (rolesData || []).map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        hierarchy_level: role.hierarchy_level,
        permissions: Array.isArray(role.permissions) ? (role.permissions as string[]) : [],
      }));

      setRoles(mappedRoles);

      // Load users with roles
      const { data, error } = await supabase.functions.invoke('manage-roles', {
        body: { action: 'list_users' },
      });

      if (error) throw error;
      if (data?.users) {
        setUsers(data.users);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantRole = async (userId: string, roleName: string) => {
    setProcessing(`grant-${userId}-${roleName}`);
    try {
      const { data, error } = await supabase.functions.invoke('manage-roles', {
        body: {
          action: 'grant',
          userId,
          roleName,
        },
      });

      if (error) throw error;

      toast({
        title: t.roleGranted,
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRevokeRole = async (userId: string, roleName: string) => {
    setProcessing(`revoke-${userId}-${roleName}`);
    try {
      const { data, error } = await supabase.functions.invoke('manage-roles', {
        body: {
          action: 'revoke',
          userId,
          roleName,
        },
      });

      if (error) throw error;

      toast({
        title: t.roleRevoked,
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const getRoleBadgeVariant = (hierarchyLevel: number) => {
    if (hierarchyLevel >= 90) return 'destructive';
    if (hierarchyLevel >= 70) return 'default';
    if (hierarchyLevel >= 40) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t.loadingUsers}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {user.display_name || user.discord_username || 'Unknown User'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <Select
                  onValueChange={(roleName) => handleGrantRole(user.id, roleName)}
                  disabled={processing !== null}
                >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t.selectRole} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          {roleLabels[role.name]?.[language] || role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
                <Button
                  size="sm"
                    disabled={processing?.startsWith(`grant-${user.id}`) ?? false}
                >
                    {processing?.startsWith(`grant-${user.id}`) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">{t.currentRoles}</p>
                {user.roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.noRoles}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((userRole) => {
                      const roleInfo = roles.find((r) => r.name === userRole.name);
                      const level = roleInfo?.hierarchy_level ?? userRole.hierarchy_level ?? 0;
                      return (
                        <Badge
                          key={userRole.name}
                          variant={getRoleBadgeVariant(level)}
                          className="flex items-center gap-2"
                        >
                          {roleLabels[userRole.name]?.[language] || roleInfo?.name || userRole.name}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => handleRevokeRole(user.id, userRole.name)}
                            disabled={processing === `revoke-${user.id}-${userRole.name}`}
                          >
                            {processing === `revoke-${user.id}-${userRole.name}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <UserMinus className="h-3 w-3" />
                            )}
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}