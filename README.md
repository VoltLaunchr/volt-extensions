# Volt Extensions

Official extension API, examples, and community plugins for [Volt launcher](https://github.com/VoltLaunchr/Volt).

## What is Volt?

Volt is a fast, modern desktop launcher for Windows, macOS, and Linux. Like Raycast or Alfred, but open-source and extensible.

## Plugin API

Build your own plugins using our TypeScript or Rust API:

### TypeScript (Frontend Plugins)

```bash
npm install @voltlaunchrr/plugin-api
# or
bun add @voltlaunchrr/plugin-api
# or
pnpm add @voltlaunchrr/plugin-api
```

```typescript
import { Plugin, PluginContext, PluginResult, PluginResultType } from '@voltlaunchrr/plugin-api';

export class MyPlugin implements Plugin {
  id = 'my-plugin';
  name = 'My Plugin';
  description = 'Does something cool';
  enabled = true;

  canHandle(context: PluginContext): boolean {
    return context.query.startsWith('my:');
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    return [
      {
        id: 'result-1',
        type: PluginResultType.Info,
        title: 'Hello from my plugin!',
        subtitle: 'Query: ' + context.query,
        score: 100,
      },
    ];
  }

  async execute(result: PluginResult): Promise<void> {
    console.log('Executed:', result.title);
  }
}

export default MyPlugin;
```

### Rust (Backend Plugins)

```toml
[dependencies]
volt-plugin-api = "0.1"
```

See [api/rust](api/rust/) for Rust plugin development.

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Create your first plugin in 5 minutes |
| [Dev Workflow](docs/dev-workflow.md) | Test extensions locally with hot reload |
| [Plugin API Reference](docs/plugin-api.md) | Complete API documentation |
| [TypeScript API](docs/typescript-api.md) | Frontend plugin development |
| [Rust API](docs/rust-api.md) | Backend plugin development (optional) |
| [Publishing Extensions](docs/publishing.md) | Share your plugin with the community |
| [CLI Tool](docs/cli.md) | Scaffold, validate, and package extensions |

## Examples

Working examples in [examples/](examples/):

| Extension | Description | Trigger |
|-----------|-------------|---------|
| [Calculator](examples/calculator/) | Math expressions, unit conversions, date calculations, timezone conversions | `2+2`, `10km to miles`, `time in Tokyo` |
| [Password Generator](examples/password-generator/) | Cryptographically secure passwords, passphrases (NIST/EFF standards) | `pass`, `pass strong`, `pass simple`, `pass phrase`, `pass pin` |
| [Web Search](examples/websearch/) | Search Google, Bing, or DuckDuckGo from Volt | `?`, `web`, `search`, `google`, `bing`, `ddg` |

## Extension Registry

Published extensions are listed in [`registry.json`](registry.json). Volt uses this registry to power the extension store. See [Publishing Guide](docs/publishing.md) for how to add your extension.

## Templates

Quick-start templates for new plugins:

- [TypeScript Plugin Template](templates/typescript-plugin/) - Frontend plugin boilerplate
- [Rust Plugin Template](templates/rust-plugin/) - Backend plugin boilerplate

## Community Extensions

Want to share your plugin? See [community/](community/) for submission guidelines.

Currently available:

| Extension | Category | Author |
|-----------|----------|--------|
| [Password Generator](examples/password-generator/) | Utilities | VoltLaunchr Community |

## CLI Tool

The `volt-plugin` CLI streamlines extension development:

```bash
npm install -g @voltlaunchrr/plugin-cli
# or: bun add -g @voltlaunchrr/plugin-cli
# or: pnpm add -g @voltlaunchrr/plugin-cli

volt-plugin init my-extension    # Scaffold a new extension
volt-plugin test                 # Validate manifest, interface, and types
volt-plugin publish              # Package and generate registry entry
```

See the [CLI documentation](docs/cli.md) for details.

## Support

- [Report a bug](https://github.com/VoltLaunchr/volt-extensions/issues)
- [Request a feature](https://github.com/VoltLaunchr/volt-extensions/issues)

## License

MIT License — see [LICENSE](LICENSE) for details.
