# @volt/plugin-api

TypeScript API for building Volt launcher plugins.

## Installation

```bash
npm install @volt/plugin-api
```

## Usage

```typescript
import { Plugin, PluginContext, PluginResult } from "@volt/plugin-api";

export class MyPlugin implements Plugin {
  id = "my-plugin";
  name = "My Plugin";
  description = "My awesome plugin";
  enabled = true;

  canHandle(context: PluginContext): boolean {
    return context.query.length > 0;
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    return [
      {
        id: "result-1",
        type: "info",
        title: "Hello!",
        score: 100,
      },
    ];
  }

  async execute(result: PluginResult): Promise<void> {
    console.log("Executed!");
  }
}
```

See [docs](../../docs/) for full documentation.
