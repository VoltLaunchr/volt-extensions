# Volt Extensions

Official extension registry and plugin API for [Volt launcher](https://github.com/VoltLaunchr/Volt).

## About Volt

Volt is a fast, open-source desktop launcher for Windows, macOS, and Linux. Built with Tauri 2 + React + Rust, it supports community extensions to add custom functionality.

## Getting Started

### Building an Extension

Extensions are TypeScript plugins that run inside Volt's sandboxed worker environment. Each extension declares its capabilities via a manifest and exports a default plugin object.

```typescript
import type { Plugin, PluginContext, PluginResult } from '@volt/plugin-api';

const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  description: 'Does something useful',
  keyword: 'my',
  enabled: true,

  canHandle(context: PluginContext): boolean {
    return context.query.startsWith('my:');
  },

  async match(context: PluginContext): Promise<PluginResult[]> {
    return [{
      id: 'result-1',
      type: 'info',
      title: 'Hello from my plugin!',
      subtitle: 'Query: ' + context.query,
      score: 100,
    }];
  },

  async execute(result: PluginResult): Promise<void> {
    console.log('Executed:', result.title);
  },
};

export default myPlugin;
```

### Extension Manifest

Every extension needs a `manifest.json`:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Short description of what it does",
  "author": "your-github-username",
  "keyword": "my",
  "permissions": []
}
```

Available permissions: `clipboard`, `network`, `notifications`, `storage`.

## Repository Structure

```
api/            TypeScript and Rust plugin API definitions
community/      Community-submitted extensions
docs/           Developer documentation
examples/       Working reference extensions
  calculator/   Math calculator plugin
  websearch/    Web search plugin
  password-generator/  Secure password generation
scripts/        Build and validation scripts
templates/      Boilerplate for new extensions
registry.json   Published extension registry
```

## Documentation

- [Getting Started](docs/getting-started.md) — Create your first plugin
- [Plugin API Reference](docs/plugin-api.md) — Full API documentation
- [TypeScript API](docs/typescript-api.md) — Frontend plugin development
- [Rust API](docs/rust-api.md) — Backend plugin development
- [Publishing](docs/publishing.md) — Submit your extension to the registry

## Examples

| Extension | Description | Keyword |
|-----------|-------------|---------|
| [Calculator](examples/calculator/) | Inline math evaluation | `calc` |
| [Web Search](examples/websearch/) | Search engines from Volt | `?` |
| [Password Generator](examples/password-generator/) | NIST-compliant password generation | `pass` |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting extensions.

All contributions go through a security review before being added to the registry.

## Support

- [Bug Reports](https://github.com/VoltLaunchr/volt-extensions/issues/new?template=bug_report.yml)
- [Feature Requests](https://github.com/VoltLaunchr/volt-extensions/issues/new?template=feature_request.yml)
- [Discussions](https://github.com/VoltLaunchr/volt-extensions/discussions)

## License

MIT — see [LICENSE](LICENSE) for details.
