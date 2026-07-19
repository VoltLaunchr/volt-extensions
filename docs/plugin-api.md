# Plugin API Reference

Complete reference for the Volt Plugin API.

## Core Interfaces

### Plugin

The main interface for all plugins.

```typescript
interface Plugin {
  // Unique identifier (lowercase, no spaces)
  id: string;

  // Display name
  name: string;

  // Short description
  description: string;

  // Whether plugin is enabled
  enabled: boolean;

  // Check if plugin can handle this query
  canHandle(context: PluginContext): boolean;

  // Generate results for the query
  match(
    context: PluginContext,
  ): Promise<PluginResult[]> | PluginResult[] | null;

  // Execute when user selects a result
  execute(result: PluginResult): Promise<void> | void;
}
```

### PluginContext

Context passed to plugin methods.

```typescript
interface PluginContext {
  // User's search query
  query: string;

  // Optional plugin settings
  settings?: Record<string, unknown>;
}
```

### PluginResult

Result returned by a plugin.

```typescript
interface PluginResult {
  // Unique ID for this result
  id: string;

  // Result type (calculator, websearch, etc.)
  type: PluginResultType;

  // Main text displayed
  title: string;

  // Secondary text (optional)
  subtitle?: string;

  // Icon (emoji or path)
  icon?: string;

  // Badge text (e.g., "Plugin")
  badge?: string;

  // Score for ranking (higher = better)
  score: number;

  // Additional data for execute()
  data?: Record<string, unknown>;

  // Plugin that created this result
  pluginId?: string;
}
```

### PluginResultType

Available result types for categorizing plugin output:

```typescript
enum PluginResultType {
  Calculator = "calculator",
  WebSearch = "websearch",
  SystemCommand = "systemcommand",
  FileExplorer = "fileexplorer",
  Timer = "timer",
  SystemMonitor = "systemmonitor",
  Steam = "steam",
  Game = "game",
  Clipboard = "clipboard",
  Emoji = "emoji",
  Info = "info",
  Password = "password",
  ShellCommand = "shellcommand",
  GridItem = "grid",
  AiChat = "aichat",
}
```

### PluginRegistry

The registry manages all loaded plugins, handles parallel querying with timeout protection, and sorts results by score.

```typescript
interface PluginRegistry {
  plugins: Map<string, Plugin>;
  register(plugin: Plugin): void;
  unregister(pluginId: string): void;
  getPlugin(pluginId: string): Plugin | undefined;
  getAllPlugins(): Plugin[];
  getEnabledPlugins(): Plugin[];
  query(context: PluginContext): Promise<PluginResult[]>;
}
```

Key behavior:

- `query()` calls all enabled plugins **in parallel** with a **500ms timeout** per plugin
- Failed plugins are caught silently (one plugin crash won't break others)
- Results are merged, tagged with `pluginId`, and sorted by `score` descending

## Plugin Lifecycle

1. **Registration**: Volt loads the extension manifest and registers one Worker plugin per command when `commands[]` is present.
2. **Query routing**: External extensions are routed by manifest `keywords`, `prefix`, or command triggers before Worker code runs.
3. **Result generation**: For routed extensions, `match()` is called in the Worker.
4. **Display**: Results are ranked by score and displayed in the UI
5. **Execution**: When user selects a result, `execute()` is called on the owning plugin

## Manifest Format

Every extension requires a `manifest.json`:

```json
{
  "id": "my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "description": "Short description of what it does",
  "author": {
    "name": "Your Name",
    "github": "yourusername"
  },
  "main": "index.ts",
  "icon": "assets/icon.png",
  "category": "utilities",
  "keywords": ["keyword1", "keyword2"],
  "minVoltVersion": "0.4.0",
  "permissions": ["clipboard"],
  "files": ["index.ts", "types.ts", "utils/"]
}
```

| Field               | Required | Description                                                                                        |
| ------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `id`                | Yes      | Unique identifier (lowercase, no spaces, use hyphens)                                              |
| `name`              | Yes      | Display name                                                                                       |
| `version`           | Yes      | Semantic version (e.g., `1.0.0`)                                                                   |
| `description`       | Yes      | Short description                                                                                  |
| `author`            | Yes      | Object with `name` and `github` fields                                                             |
| `main`              | Yes      | Entry point file (TypeScript or JavaScript)                                                        |
| `icon`              | No       | Path to icon file                                                                                  |
| `category`          | No       | Category for the extension store                                                                   |
| `keywords`          | No       | Search tags                                                                                        |
| `minVoltVersion`    | No       | Minimum Volt version required                                                                      |
| `permissions`       | No       | Required permissions (e.g., `clipboard`)                                                           |
| `files`             | No       | Files to include in the packaged extension                                                         |
| `commands`          | No       | Named sub-commands, each with `name`, `title`, optional `main`, and its own `prefix` or `keywords` |
| `backgroundRefresh` | No       | Optional cache refresh interval such as `30s`, `5m`, or `1h`                                       |
| `repository`        | No       | URL to the extension's source repository                                                           |
| `homepage`          | No       | URL to the extension's homepage or documentation                                                   |
| `license`           | No       | License identifier (e.g., `MIT`)                                                                   |

Supported permissions: `clipboard`, `network`, `notifications`, `openUrl`, `oauth`, `ai`, `system`.
Volt validates these permissions at install/consent time and the runtime backend re-checks them for sensitive `ext_*` commands.

## Best Practices

### Performance

- Put routing in `manifest.json` `keywords`, `prefix`, or `commands[]`; Worker code should not run for unrelated queries
- Cache expensive computations between queries
- Use async operations for network/IO-bound work
- Limit results to 5-10 items per plugin

### Scoring

| Score Range | Usage                            | Example                          |
| ----------- | -------------------------------- | -------------------------------- |
| 90-100      | Exact or high-confidence matches | Calculator: `2+2` returns `4`    |
| 70-89       | Strong matches                   | Web search with explicit trigger |
| 50-69       | Partial matches                  | Fuzzy keyword match              |
| < 50        | Weak / fallback matches          | Generic suggestions              |

### Error Handling

Always return an empty array on error - never throw from `match()`:

```typescript
async match(context: PluginContext): Promise<PluginResult[]> {
  try {
    // Your logic here
    return results;
  } catch (error) {
    console.error('Plugin error:', error);
    return [];
  }
}
```

### Data Passing

Use the `data` field to pass context from `match()` to `execute()`:

```typescript
match(context: PluginContext): PluginResult[] {
  return [{
    id: 'my-result',
    type: PluginResultType.Info,
    title: 'Copy this value',
    score: 100,
    data: { value: 'secret-data', action: 'copy' },
  }];
}

async execute(result: PluginResult): Promise<void> {
  const value = result.data?.value as string;
  // Use value...
}
```

## Examples

See [examples/](../examples/) for complete working plugins:

- **Calculator** - Math, unit conversions, dates, timezones (complex, multi-handler architecture)
- **Password Generator** - Crypto-secure passwords with NIST/EFF standards (security-focused)
- **Web Search** - Multi-engine search (simple, single-file plugin)
