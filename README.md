# Volt Extensions

Official extension API and community plugins for [Volt launcher](https://github.com/VoltLaunchr/Volt).

## 🚀 What is Volt?

Volt is a fast, modern desktop launcher for Windows, macOS, and Linux. Like Raycast or Alfred, but open-source and extensible.

## 📦 Plugin API

Build your own plugins using our TypeScript or Rust API:

### TypeScript (Frontend Plugins)

```bash
npm install @volt/plugin-api
```

```typescript
import { Plugin, PluginContext, PluginResult } from "@volt/plugin-api";

export class MyPlugin implements Plugin {
  id = "my-plugin";
  name = "My Plugin";
  description = "Does something cool";
  enabled = true;

  canHandle(context: PluginContext): boolean {
    return context.query.startsWith("my:");
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    return [
      {
        id: "result-1",
        type: "info",
        title: "Hello from my plugin!",
        subtitle: "Query: " + context.query,
        score: 100,
      },
    ];
  }

  async execute(result: PluginResult): Promise<void> {
    console.log("Executed:", result.title);
  }
}
```

### Rust (Backend Plugins)

```toml
[dependencies]
volt-plugin-api = "0.1"
```

See [api/rust](api/rust/) for Rust plugin development.

## 📚 Documentation

- 📖 [Getting Started](docs/getting-started.md) - Create your first plugin in 5 minutes
- 🔧 [Plugin API Reference](docs/plugin-api.md) - Complete API documentation
- 📝 [TypeScript API](docs/typescript-api.md) - Frontend plugin development
- 🦀 [Rust API](docs/rust-api.md) - Backend plugin development (optional)
- 🚀 [Publishing Extensions](docs/publishing.md) - Share your plugin with the community

## 🎨 Examples

Check out working examples in [examples/](examples/):

- **[Calculator](examples/calculator/)** - Simple math calculator plugin
- **[Web Search](examples/websearch/)** - Search the web from Volt

## 🛠️ Templates

Quick-start templates for new plugins:

- **[TypeScript Plugin Template](templates/typescript-plugin/)** - Frontend plugin boilerplate
- **[Rust Plugin Template](templates/rust-plugin/)** - Backend plugin boilerplate

## 🤝 Community Extensions

Want to share your plugin? See [community/](community/) for submission guidelines.

## 💬 Support

- 🐛 [Report a bug](https://github.com/VoltLaunchr/volt-extensions/issues)
- 💡 [Request a feature](https://github.com/VoltLaunchr/volt-extensions/issues)
- 💬 [Discord](https://discord.gg/volt) (coming soon)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with ⚡ by the Volt team
