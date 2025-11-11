import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Plugin, PluginManagerContext } from '@/types/plugin';

const PluginContext = createContext<PluginManagerContext | undefined>(undefined);

export const usePlugins = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePlugins must be used within PluginProvider');
  }
  return context;
};

interface PluginProviderProps {
  children: ReactNode;
}

export const PluginProvider = ({ children }: PluginProviderProps) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  const loadPlugin = useCallback(async (plugin: Plugin) => {
    // Check if plugin already exists
    if (plugins.find(p => p.metadata.id === plugin.metadata.id)) {
      console.warn(`Plugin ${plugin.metadata.id} is already loaded`);
      return;
    }

    // Call onLoad hook
    if (plugin.hooks?.onLoad) {
      await plugin.hooks.onLoad();
    }

    // Add plugin to state
    setPlugins(prev => [...prev, { ...plugin, enabled: true }]);

    // Call onActivate hook
    if (plugin.hooks?.onActivate) {
      await plugin.hooks.onActivate();
    }

    console.log(`Plugin ${plugin.metadata.name} loaded successfully`);
  }, [plugins]);

  const unloadPlugin = useCallback(async (pluginId: string) => {
    const plugin = plugins.find(p => p.metadata.id === pluginId);
    if (!plugin) {
      console.warn(`Plugin ${pluginId} not found`);
      return;
    }

    // Call onDeactivate hook
    if (plugin.hooks?.onDeactivate) {
      await plugin.hooks.onDeactivate();
    }

    // Call onUnload hook
    if (plugin.hooks?.onUnload) {
      await plugin.hooks.onUnload();
    }

    // Remove plugin from state
    setPlugins(prev => prev.filter(p => p.metadata.id !== pluginId));

    console.log(`Plugin ${plugin.metadata.name} unloaded successfully`);
  }, [plugins]);

  const enablePlugin = useCallback((pluginId: string) => {
    setPlugins(prev =>
      prev.map(p =>
        p.metadata.id === pluginId
          ? { ...p, enabled: true }
          : p
      )
    );

    const plugin = plugins.find(p => p.metadata.id === pluginId);
    if (plugin?.hooks?.onActivate) {
      plugin.hooks.onActivate();
    }
  }, [plugins]);

  const disablePlugin = useCallback((pluginId: string) => {
    setPlugins(prev =>
      prev.map(p =>
        p.metadata.id === pluginId
          ? { ...p, enabled: false }
          : p
      )
    );

    const plugin = plugins.find(p => p.metadata.id === pluginId);
    if (plugin?.hooks?.onDeactivate) {
      plugin.hooks.onDeactivate();
    }
  }, [plugins]);

  const getPlugin = useCallback((pluginId: string) => {
    return plugins.find(p => p.metadata.id === pluginId);
  }, [plugins]);

  const value: PluginManagerContext = {
    plugins,
    loadPlugin,
    unloadPlugin,
    enablePlugin,
    disablePlugin,
    getPlugin,
  };

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
};
