# @voltlaunchrr/plugin-api

TypeScript API for building Volt launcher plugins.

## Installation

```bash
npm install @voltlaunchrr/plugin-api
# or: bun add @voltlaunchrr/plugin-api
# or: pnpm add @voltlaunchrr/plugin-api
```

## Quick Start

```typescript
import { Plugin, PluginContext, PluginResult, PluginResultType } from '@voltlaunchrr/plugin-api';

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
| `PluginResultType` | Enum | Runtime result types (Calculator, WebSearch, Info, Password, ShellCommand, GridItem, AiChat, etc.) |
| `PluginRegistry` | Interface | Registry contract for managing plugins |
| `pluginRegistry` | Instance | Singleton registry with parallel querying (500ms timeout) |

## Plugin Lifecycle

1. Manifest routing - External extensions are activated by `manifest.json` `keywords`, `prefix`, or `commands[]` before Worker code runs.
2. `match(context)` - Generate results after manifest routing. Can be sync or async.
3. `execute(result)` - Called when user selects a result. Perform the action (copy, open URL, etc.).

`canHandle()` remains part of the shared plugin interface, but sandboxed external extensions should keep routing in the manifest.

## Documentation

- [Getting Started](../../../docs/getting-started.md) - Create your first plugin in 5 minutes
- [TypeScript API Guide](../../../docs/typescript-api.md) - Detailed TypeScript development guide
- [Plugin API Reference](../../../docs/plugin-api.md) - Complete interface documentation
- [Extensions](../../../extensions/) - Official store extensions
- [Examples](../../../examples/) - Educational sample extensions
