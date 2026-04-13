# @volt/plugin-api

TypeScript API for building Volt launcher plugins.

## Installation

```bash
npm install @volt/plugin-api
```

## Quick Start

```typescript
import { Plugin, PluginContext, PluginResult, PluginResultType } from '@volt/plugin-api';

export class MyPlugin implements Plugin {
  id = 'my-plugin';
  name = 'My Plugin';
  description = 'My awesome plugin';
  enabled = true;

  canHandle(context: PluginContext): boolean {
    return context.query.startsWith('my:');
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    return [{
      id: 'result-1',
      type: PluginResultType.Info,
      title: 'Hello!',
      score: 100,
    }];
  }

  async execute(result: PluginResult): Promise<void> {
    console.log('Executed!');
  }
}

export default MyPlugin;
```

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `Plugin` | Interface | Main plugin contract (`canHandle`, `match`, `execute`) |
| `PluginContext` | Interface | Query context passed to plugin methods |
| `PluginResult` | Interface | Result object returned by `match()` |
| `PluginResultType` | Enum | 12 result types (Calculator, WebSearch, Info, Password, etc.) |
| `PluginRegistry` | Interface | Registry contract for managing plugins |
| `pluginRegistry` | Instance | Singleton registry with parallel querying (500ms timeout) |

## Plugin Lifecycle

1. `canHandle(context)` - Called on every keystroke. Return `true` if your plugin handles this query. Must be fast (< 1ms).
2. `match(context)` - Generate results. Can be sync or async. Has a 500ms timeout.
3. `execute(result)` - Called when user selects a result. Perform the action (copy, open URL, etc.).

## Documentation

- [Getting Started](../../docs/getting-started.md) - Create your first plugin in 5 minutes
- [TypeScript API Guide](../../docs/typescript-api.md) - Detailed TypeScript development guide
- [Plugin API Reference](../../docs/plugin-api.md) - Complete interface documentation
- [Examples](../../examples/) - Working plugins (Calculator, Password Generator, Web Search)
