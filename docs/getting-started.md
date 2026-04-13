# Getting Started with Volt Extensions

Learn how to create your first Volt plugin in 5 minutes.

## Prerequisites

- [Volt launcher](https://voltlaunchr.com/download) installed
- Node.js 18+ (for TypeScript plugins)
- Basic TypeScript/JavaScript knowledge

## Create Your First Plugin

### 1. Create the Extension Folder

```bash
mkdir my-first-plugin
cd my-first-plugin
```

### 2. Create manifest.json

```json
{
  "id": "my-first-plugin",
  "name": "My First Plugin",
  "version": "1.0.0",
  "description": "A simple example plugin",
  "author": {
    "name": "Your Name",
    "github": "yourusername"
  },
  "main": "index.ts",
  "category": "utilities",
  "keywords": ["hello", "example"]
}
```

> See the [Plugin API Reference](plugin-api.md#manifest-format) for all available manifest fields.

### 3. Create index.ts

```typescript
import {
  Plugin,
  PluginContext,
  PluginResult,
  PluginResultType,
} from "@volt/plugin-api";

export class MyPlugin implements Plugin {
  id = "my-first-plugin";
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

### 4. Link Your Plugin to Volt (Dev Mode)

1. Open Volt (`Ctrl+Shift+Space`)
2. Go to **Settings** > **Extensions**
3. Click **"Link Dev Extension"**
4. Select your plugin folder (e.g., `D:\dev\my-first-plugin`)

Your extension is now linked and ready to test!

### 5. Test Your Plugin

1. Type "hello" in Volt's search bar
2. See your plugin result appear with the "DEV" badge
3. Press Enter to execute

### 6. Make Changes (Hot Reload)

1. Edit your `index.ts` or `manifest.json`
2. Save the file
3. Refresh Volt (`Ctrl+R`) or use "Refresh Dev Extension"
4. Your changes are immediately visible!

## (Optional) Install API for Type Hints

For better IDE support and type checking:

```bash
npm init -y
npm install @volt/plugin-api
```

## Next Steps

- Read the [Dev Workflow Guide](dev-workflow.md) for hot reload and dev commands
- Check the [Plugin API Reference](plugin-api.md) for full interface documentation
- Explore working examples:
  - [Calculator](../examples/calculator/) - Math, units, dates, timezones (complex plugin)
  - [Password Generator](../examples/password-generator/) - Crypto-secure passwords (security-focused)
  - [Web Search](../examples/websearch/) - Multi-engine web search (simple plugin)
- Learn about [Publishing](publishing.md) when ready to share
