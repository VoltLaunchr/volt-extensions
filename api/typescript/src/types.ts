// Plugin system types

export type ActionHandler =
  | 'openUrl'
  | 'copyToClipboard'
  | 'openFile'
  | 'runCommand'
  | 'custom';

export interface PluginResultAction {
  id: string;
  title: string;
  icon?: string;
  shortcut?: string;
  handler: ActionHandler;
  data?: Record<string, unknown>;
}

export enum PluginResultType {
  Calculator = 'calculator',
  WebSearch = 'websearch',
  SystemCommand = 'systemcommand',
  FileExplorer = 'fileexplorer',
  Timer = 'timer',
  SystemMonitor = 'systemmonitor',
  Steam = 'steam',
  Game = 'game',
  Clipboard = 'clipboard',
  Emoji = 'emoji',
  Info = 'info',
  Password = 'password',
}

export interface PluginResult {
  id: string;
  type: PluginResultType;
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: string; // Badge text displayed on the right (e.g., "Game", "App")
  score: number;
  data?: Record<string, unknown>;
  pluginId?: string; // ID of the plugin that created this result
  actions?: PluginResultAction[];
}

export interface PluginContext {
  query: string;
  settings?: Record<string, unknown>;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;

  /**
   * Test if this plugin should handle the query
   * @returns true if plugin can handle this query
   */
  canHandle(context: PluginContext): boolean;

  /**
   * Generate results for the query
   * @returns array of plugin results or null if no matches
   */
  match(context: PluginContext): Promise<PluginResult[]> | PluginResult[] | null;

  /**
   * Execute the action for a plugin result
   */
  execute(result: PluginResult): Promise<void> | void;
}

export interface IPluginRegistry {
  plugins: Map<string, Plugin>;
  register(plugin: Plugin): void;
  unregister(pluginId: string): void;
  getPlugin(pluginId: string): Plugin | undefined;
  getAllPlugins(): Plugin[];
  getEnabledPlugins(): Plugin[];
  query(context: PluginContext): Promise<PluginResult[]>;
}

// ── Extension manifest types ─────────────────────────────────────────────────

export type ExtensionPreferenceType =
  | 'text'
  | 'secret'
  | 'number'
  | 'boolean'
  | 'select'
  | 'file'
  | 'directory';

export interface ExtensionPreference {
  name: string;
  type: ExtensionPreferenceType;
  title: string;
  description?: string;
  required?: boolean;
  default?: string | number | boolean;
  options?: string[];
  min?: number;
  max?: number;
}

/** A single named command exposed by the extension (multi-command support). */
export interface ExtensionCommand {
  name: string;
  title: string;
  description?: string;
  main?: string;
  prefix?: string;
  keywords?: string[];
  icon?: string;
}

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: { name: string; github?: string; email?: string };
  icon?: string;
  keywords?: string[];
  prefix?: string;
  category?: string;
  repository?: string;
  homepage?: string;
  license?: string;
  minVoltVersion?: string;
  permissions?: string[];
  main?: string;
  preferences?: ExtensionPreference[];
  commands?: ExtensionCommand[];
}
