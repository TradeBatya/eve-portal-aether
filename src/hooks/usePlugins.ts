import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plugin, UserPlugin } from '@/types';

export const usePluginsData = () => {
  return useQuery({
    queryKey: ['plugins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plugins')
        .select('*')
        .eq('enabled', true)
        .order('name');

      if (error) throw error;
      return data as Plugin[];
    },
  });
};

export const useUserPlugins = (userId?: string) => {
  return useQuery({
    queryKey: ['user-plugins', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_plugins')
        .select('*, plugins(*)')
        .eq('user_id', userId!)
        .order('installed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useInstallPlugin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, pluginId }: { userId: string; pluginId: string }) => {
      const { data, error } = await supabase
        .from('user_plugins')
        .insert({
          user_id: userId,
          plugin_id: pluginId,
          enabled: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserPlugin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-plugins'] });
      toast({
        title: 'Plugin installed',
        description: 'Plugin has been successfully installed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Installation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useTogglePlugin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('user_plugins')
        .update({ enabled })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-plugins'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUninstallPlugin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_plugins')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-plugins'] });
      toast({
        title: 'Plugin uninstalled',
        description: 'Plugin has been successfully uninstalled',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Uninstall failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
