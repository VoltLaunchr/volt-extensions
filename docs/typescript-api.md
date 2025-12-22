# TypeScript API

Detailed guide for building TypeScript plugins for Volt.

## Installation

```bash
npm install @volt/plugin-api
```

## Project Setup

### 1. Initialize your project

```bash
mkdir my-volt-plugin
cd my-volt-plugin
npm init -y
npm install @volt/plugin-api
npm install -D typescript @types/node
```

### 2. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. Create your plugin

Create `src/index.ts`:

```typescript
import {
  Plugin,
  PluginContext,
  PluginResult,
  PluginResultType,
} from "@volt/plugin-api";

export class MyPlugin implements Plugin {
  id = "my-plugin";
  name = "My Plugin";
  description = "Does something useful";
  enabled = true;

  canHandle(context: PluginContext): boolean {
    return context.query.length > 0;
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    return [
      {
        id: "result-1",
        type: PluginResultType.Info,
        title: "My Result",
        subtitle: context.query,
        score: 100,
      },
    ];
  }

  async execute(result: PluginResult): Promise<void> {
    console.log("Executed:", result.title);
  }
}
```

## Advanced Features

### State Management

Store state between queries:

```typescript
export class StatefulPlugin implements Plugin {
  private cache = new Map<string, any>();

  async match(context: PluginContext): Promise<PluginResult[]> {
    const cached = this.cache.get(context.query);
    if (cached) return cached;

    const results = await this.fetchResults(context.query);
    this.cache.set(context.query, results);
    return results;
  }
}
```

### Settings Support

Access user settings:

```typescript
canHandle(context: PluginContext): boolean {
  const enabled = context.settings?.enabled ?? true;
  return enabled && context.query.length > 0;
}
```

### React Components

For custom UI (advanced):

```typescript
import React from "react";

export class CustomUIPlugin implements Plugin {
  // ... other methods

  renderDetail(result: PluginResult): React.ReactElement {
    return <div>Custom UI for {result.title}</div>;
  }
}
```

## Testing

```typescript
import { MyPlugin } from "./index";

describe("MyPlugin", () => {
  const plugin = new MyPlugin();

  it("should handle queries", () => {
    expect(plugin.canHandle({ query: "test" })).toBe(true);
  });

  it("should return results", async () => {
    const results = await plugin.match({ query: "test" });
    expect(results.length).toBeGreaterThan(0);
  });
});
```

## See Also

- [Plugin API Reference](plugin-api.md)
- [Examples](../examples/)
- [Publishing Guide](publishing.md)
