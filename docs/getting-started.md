# Getting Started with Volt Extensions

Learn how to create your first Volt plugin in 5 minutes.

## Prerequisites

- Node.js 18+ (for TypeScript plugins)
- Volt launcher installed
- Basic TypeScript/JavaScript knowledge

## Create Your First Plugin

### 1. Install the API

```bash
npm install @volt/plugin-api
```

### 2. Create the Plugin

Create a file `my-plugin.ts`:

```typescript
import {
  Plugin,
  PluginContext,
  PluginResult,
  PluginResultType,
} from "@volt/plugin-api";

export class MyPlugin implements Plugin {
  id = "my-plugin";
  name = "My First Plugin";
  description = "A simple example plugin";
  enabled = true;

  canHandle(context: PluginContext): boolean {
    // Only handle queries starting with "hello"
    return context.query.toLowerCase().startsWith("hello");
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    const query = context.query.toLowerCase();

    return [
      {
        id: "hello-result",
        type: PluginResultType.Info,
        title: "Hello, Volt!",
        subtitle: "You searched for: " + query,
        icon: "👋",
        score: 100,
        data: { message: "Hello from my plugin!" },
      },
    ];
  }

  async execute(result: PluginResult): Promise<void> {
    // Do something when the result is selected
    console.log("Plugin executed:", result.data?.message);
    alert("Hello from your plugin!");
  }
}
```

### 3. Test Your Plugin

1. Build your plugin: `npm run build`
2. Copy the built file to Volt's plugin directory
3. Restart Volt
4. Type "hello" in the search bar
5. See your plugin result!

## Next Steps

- Read the [Plugin API Reference](plugin-api.md)
- Check out [Examples](../examples/)
- Learn about [Publishing](publishing.md)
