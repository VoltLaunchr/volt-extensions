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
  ShellCommand = 'shellcommand',
  GridItem = 'grid',
  AiChat = 'aichat',
}

export type PluginActivationMode = 'declarative' | 'always' | 'custom';
export type ActivationKind = 'prefix' | 'keyword' | 'always' | 'none';

export interface PluginActivation {
  prefixes?: string[];
  keywords?: string[];
  mode?: PluginActivationMode;
  minLength?: number;
}

export interface ActivationMatch {
  matched: boolean;
  kind: ActivationKind;
  stripped: string;
  token?: string;
}

export interface PluginResultAccessory {
  icon?: string;
  text?: string;
  color?: string;
  tag?: boolean;
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
  accessories?: PluginResultAccessory[];
  section?: string;
  layout?: 'grid';
  matchKind?: ActivationKind;
}

export interface PluginContext {
  query: string;
  settings?: Record<string, unknown>;
  activation?: ActivationMatch;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  activation?: PluginActivation;

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
  | 'directory'
  | 'oauth';

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
  oauthProvider?: string;
  oauthAuthUrl?: string;
  oauthTokenUrl?: string;
  oauthClientId?: string;
  oauthScopes?: string[];
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

export type ExtensionCategory =
  | 'productivity'
  | 'utilities'
  | 'developer'
  | 'media'
  | 'social'
  | 'finance'
  | 'games'
  | 'system'
  | 'other';

export const EXTENSION_PERMISSIONS = [
  'clipboard',
  'network',
  'notifications',
  'openUrl',
  'oauth',
  'ai',
  'system',
] as const;

export type ExtensionPermission = (typeof EXTENSION_PERMISSIONS)[number];

export interface ExtensionBackgroundRefresh {
  interval: string;
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
  category?: ExtensionCategory;
  repository?: string;
  homepage?: string;
  license?: string;
  minVoltVersion?: string;
  permissions?: ExtensionPermission[];
  main?: string;
  preferences?: ExtensionPreference[];
  commands?: ExtensionCommand[];
  backgroundRefresh?: ExtensionBackgroundRefresh;
}

export interface VoltStorageAPI {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface VoltOAuthAuthorizeOptions {
  provider: string;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  scopes?: string[];
}

export interface VoltOAuthResult {
  token?: string;
  error?: string;
  success?: boolean;
}

export interface VoltOAuthAPI {
  authorize(opts: VoltOAuthAuthorizeOptions): Promise<VoltOAuthResult>;
  getToken(provider: string): Promise<VoltOAuthResult>;
  revokeToken(provider: string): Promise<void>;
}

export type VoltAICreativity = 'none' | 'low' | 'medium' | 'high' | 'maximum' | number;
export type VoltAIProvider = 'openai' | 'anthropic' | 'groq' | 'huggingface';

export type VoltAIModel =
  | 'openai:gpt-4o'
  | 'openai:gpt-4o-mini'
  | 'openai:gpt-4-turbo'
  | 'openai:o1'
  | 'openai:o1-mini'
  | 'openai:o3-mini'
  | 'anthropic:claude-opus-4-8'
  | 'anthropic:claude-sonnet-4-6'
  | 'anthropic:claude-haiku-4-5-20251001'
  | 'groq:llama-3.3-70b-versatile'
  | 'groq:llama-3.1-8b-instant'
  | 'groq:llama-3.1-70b-versatile'
  | 'groq:mixtral-8x7b-32768'
  | 'huggingface:openai/gpt-oss-20b'
  | (string & Record<never, never>);

export type VoltAIChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; mediaType: string; data: string };

export interface VoltAIChatTurn {
  role: 'user' | 'assistant';
  content: VoltAIChatContentPart[];
}

export interface VoltAIImagePart {
  mediaType: string;
  data: string;
}

export interface VoltAIAskOptions {
  provider: VoltAIProvider;
  apiKeyPreference: string;
  model?: VoltAIModel;
  maxTokens?: number;
  system?: string;
  creativity?: VoltAICreativity;
  temperature?: number;
  history?: VoltAIChatTurn[];
  images?: VoltAIImagePart[];
  signal?: AbortSignal;
}

export interface VoltAIAPI {
  ask(prompt: string, options: VoltAIAskOptions, onChunk?: (chunk: string) => void): Promise<string>;
}

export interface VoltSecretsAPI {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface AppInfo {
  id: string;
  name: string;
  path: string;
  icon?: string | null;
  description?: string | null;
}

export interface VoltSystemAPI {
  getApplications(): Promise<AppInfo[]>;
  showInFolder(path: string): Promise<void>;
  moveToTrash(path: string): Promise<void>;
}

export interface ToastOptions {
  message: string;
  title?: string;
  subtitle?: string;
  style?: 'info' | 'success' | 'error';
  duration?: number;
}

export interface VoltAPIInterface {
  types: {
    PluginResultType: typeof PluginResultType;
  };
  utils: {
    fuzzyScore(query: string, target: string): number;
    copyToClipboard(text: string): Promise<boolean>;
    openUrl(url: string): Promise<void>;
    pasteText(text: string): void;
    formatNumber(num: number): string;
  };
  storage: VoltStorageAPI;
  events: {
    emit(event: string, payload?: unknown): void;
    on(event: string, handler: (payload: unknown) => void): () => void;
  };
  getPreference<T = unknown>(key: string, defaultValue?: T): Promise<T | null>;
  setPreference(key: string, value: string | number | boolean): Promise<void>;
  secrets: VoltSecretsAPI;
  oauth: VoltOAuthAPI;
  ai: VoltAIAPI;
  system: VoltSystemAPI;
  saveCredential(service: string, token: string): void;
  fetch(url: string, options?: RequestInit): Promise<Response>;
  captureException(
    error: Error | string,
    context?: Record<string, unknown>,
    severity?: 'error' | 'warning'
  ): void;
  notify(message: string, type?: 'info' | 'success' | 'error'): void;
  showToast(opts: ToastOptions): void;
  showHUD(message: string): void;
  confirm(message: string): Promise<boolean>;
  updateCommandMetadata(opts: { title?: string; subtitle?: string }): void;
}

declare global {
  interface Window {
    VoltAPI?: VoltAPIInterface;
  }

  // Worker extensions access VoltAPI through globalThis.
  // eslint-disable-next-line no-var
  var VoltAPI: VoltAPIInterface | undefined;
}
