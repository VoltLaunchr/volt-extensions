# volt-extensions

Official community extensions repository for [Volt](https://github.com/VoltLaunchr/Volt) — the keyboard-driven launcher.

## Structure

```
templates/          # Starter templates
  typescript-plugin/  # TypeScript extension template
  rust-plugin/        # Rust backend plugin template
examples/           # Production-ready example extensions
  password-generator/ # Crypto-secure password generator (EFF Diceware)
cli/                # volt-plugin CLI tool (init, test, publish)
```

## Quick Start

### 1. Install the CLI

```bash
npm install -g @voltlaunchrr/plugin-cli
```

### 2. Scaffold a new extension

```bash
volt-plugin init my-extension
cd my-extension
```

The CLI prompts for: extension ID, name, description, author, category, permissions, trigger prefix, and keywords. It generates `manifest.json`, `src/index.ts`, `package.json`, `tsconfig.json`, and installs dependencies.

### 3. Link to Volt for testing

1. Open Volt → Settings → Extensions
2. Click **Link Dev Extension**
3. Select your extension folder
4. Type your trigger keyword to test

## Security model

Extensions run in a **Web Worker sandbox** with the following restrictions:

- `eval()`, `new Function()`, `WebSocket`, `XMLHttpRequest`, `importScripts()` are **disabled**
- Fetch requests are proxied through Volt's network layer:
  - Private IP ranges blocked (SSRF protection)
  - HTTP redirects blocked
  - `Cookie` / `Authorization` headers stripped
  - Response body capped at 10 MB
- Only these permissions are accepted by the backend: `clipboard`, `network`, `notifications`, `openUrl`
- `installed.json` is HMAC-signed; a mismatch resets all `granted_permissions` (fail-closed)

## CLI reference

| Command | Description |
|---------|-------------|
| `volt-plugin init` | Scaffold a new extension with interactive prompts |
| `volt-plugin test` | Validate manifest, plugin interface, and TypeScript types |
| `volt-plugin publish` | Package as ZIP and output registry entry JSON |

## Contributing

1. Fork this repository
2. Create a branch: `git checkout -b extension/my-extension`
3. Add your extension under `extensions/`
4. Run `volt-plugin test` to validate
5. Open a Pull Request

See [Publishing Guide](https://voltlaunchr.dev/docs/plugins/publishing) for the full submission process.

## Documentation

- [Plugin Development Guide](https://voltlaunchr.dev/docs/plugins/development)
- [API Reference](https://voltlaunchr.dev/docs/plugins/api-reference)
- [Best Practices](https://voltlaunchr.dev/docs/plugins/best-practices)
- [Examples](https://voltlaunchr.dev/docs/plugins/examples)
