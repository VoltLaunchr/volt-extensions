# Extension Development Workflow

This guide explains how to develop and test Volt extensions locally.

## Quick Start

### 1. Download Volt

Download Volt from [voltlaunchr.com](https://voltlaunchr.com/download) or [GitHub Releases](https://github.com/VoltLaunchr/Volt/releases).

### 2. Create Your Extension

Create a folder for your extension with the following structure:

```
my-extension/
├── manifest.json       # Required - Extension metadata
├── index.ts           # Required - Main entry point
└── README.md          # Optional - Documentation
```

### 3. Create manifest.json

```json
{
  "id": "my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "description": "My awesome Volt extension",
  "author": {
    "name": "Your Name",
    "github": "yourusername"
  },
  "main": "index.ts",
  "category": "utilities",
  "keywords": ["example", "demo"]
}
```

### 4. Create index.ts

```typescript
import {
  Plugin,
  PluginContext,
  PluginResult,
  PluginResultType,
} from "@voltlaunchrr/plugin-api";

export class MyExtension implements Plugin {
  id = "my-extension";
  name = "My Extension";
  description = "My awesome extension";
  enabled = true;

  canHandle(context: PluginContext): boolean {
    return context.query.toLowerCase().startsWith("my ");
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    const query = context.query.substring(3); // Remove "my " prefix

    return [
      {
        id: "my-result",
        type: PluginResultType.Info,
        title: `Hello from My Extension!`,
        subtitle: `You typed: ${query}`,
        icon: "🔌",
        score: 100,
        data: { query },
      },
    ];
  }

  async execute(result: PluginResult): Promise<void> {
    console.log("Extension executed:", result.data);
    // Your action here
  }
}

export default MyExtension;
```

### 5. Link Your Extension to Volt

Open Volt and use the **Link Dev Extension** command:

1. Press `Ctrl+Space` to open Volt (or use your configured hotkey)
2. Type `settings` and go to Extensions
3. Click "Link Dev Extension"
4. Select your extension folder (e.g., `D:\dev\my-extension`)

### 6. Test Your Extension

1. Type your trigger (e.g., `my hello world`)
2. See your extension result appear
3. Press Enter to execute

### 7. Hot Reload

When you modify your extension files:

1. Save your changes
2. Press `Ctrl+R` in Volt to refresh
3. Or use the "Refresh Dev Extension" command

## Dev Extension Controls

Use **Settings → Extensions** to link, unlink, enable, disable, or refresh a development extension. These controls call internal Tauri commands; `extensionService` is not part of the public extension API.

## Dev Extension Badge

Dev extensions appear with a "DEV" badge in the UI to distinguish them from installed extensions.

## File Structure

Volt stores development-extension state under its Tauri application-data directory. Treat the location as an implementation detail and use the Settings UI rather than editing the state file.

## Best Practices

1. **Keep manifest.json updated** - Changes are hot-reloaded
2. **Use TypeScript** - Better IDE support and type checking
3. **Test with different queries** - Ensure `canHandle()` works correctly
4. **Check the console** - Use `console.log()` for debugging
5. **Handle errors gracefully** - Don't crash on invalid input

## Troubleshooting

### Extension not appearing

- Check that `manifest.json` exists and is valid JSON
- Verify `canHandle()` returns `true` for your query
- Check the Volt console for errors

### Changes not reflecting

- Use the refresh command
- Check that you saved all files
- Restart Volt if needed

### manifest.json errors

Common issues:

- Missing required fields (`id`, `name`, `version`, `description`, `author`, `main`)
- Invalid JSON syntax
- Wrong `main` entry point path

## Example: Full Development Cycle

```bash
# 1. Create extension folder
mkdir my-volt-extension
cd my-volt-extension

# 2. Create manifest.json and index.ts (see above)

# 3. Link to Volt from Settings → Extensions

# 4. Test in Volt
# Type your trigger, see results

# 5. Make changes, save, refresh

# 6. When ready, run volt-plugin publish and submit the source PR
```

## Publishing Your Extension

When your extension is ready:

1. Test thoroughly with the dev workflow
2. Create a proper README.md
3. Add a `manifest.json` with all required fields (see [Plugin API Reference](plugin-api.md#manifest-format))
4. Package with `node scripts/package-extension.js <your-extension-folder>`
5. Submit to the [volt-extensions](https://github.com/VoltLaunchr/volt-extensions) repository
6. See [Publishing Guide](publishing.md) for details

## Reference Examples

| Example                                                 | Complexity | Description                                    |
| ------------------------------------------------------- | ---------- | ---------------------------------------------- |
| [Web Search](../examples/websearch/)                    | Simple     | Single-file, prefix-based triggers             |
| [Calculator](../examples/calculator/)                   | Complex    | Multi-handler, parser pattern, React component |
| [Password Generator](../extensions/password-generator/) | Medium     | Crypto-secure generation, multiple modes       |
