import { ReactNode } from 'react';

// Plugin lifecycle hooks
export interface PluginHooks {
  onLoad?: () => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
  onActivate?: () => void | Promise<void>;
  onDeactivate?: () => void | Promise<void>;
}

// Plugin route configuration
export interface PluginRoute {
  path: string;
  element: ReactNode;
  protected?: boolean;
}

// Plugin navigation item
export interface PluginNavItem {
  title: string;
  icon?: ReactNode;
  href: string;
  order?: number;
}

// Plugin metadata
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies?: string[];
}

// Main plugin interface
export interface Plugin {
  metadata: PluginMetadata;
  hooks?: PluginHooks;
  routes?: PluginRoute[];
  navItems?: PluginNavItem[];
  components?: Record<string, React.ComponentType<any>>;
  enabled?: boolean;
}

// Plugin manager context
export interface PluginManagerContext {
  plugins: Plugin[];
  loadPlugin: (plugin: Plugin) => Promise<void>;
  unloadPlugin: (pluginId: string) => Promise<void>;
  enablePlugin: (pluginId: string) => void;
  disablePlugin: (pluginId: string) => void;
  getPlugin: (pluginId: string) => Plugin | undefined;
}
