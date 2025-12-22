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
    context: PluginContext
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
}
```

## Best Practices

### Performance

- Keep `canHandle()` fast (< 1ms)
- Cache expensive data
- Use async operations for network requests
- Limit results to 5-10 items

### Scoring

- Use 90-100 for exact matches
- Use 70-89 for strong matches
- Use 50-69 for partial matches
- Use < 50 for weak matches

### Error Handling

```typescript
async match(context: PluginContext): Promise<PluginResult[]> {
  try {
    // Your logic here
    return results;
  } catch (error) {
    console.error('Plugin error:', error);
    return []; // Return empty on error
  }
}
```

## Examples

See [examples/](../examples/) for complete working plugins.
