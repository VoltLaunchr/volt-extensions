# volt-extensions

Official community extensions repository for [Volt](https://github.com/VoltLaunchr/Volt) — the keyboard-driven launcher.

## Structure

```
extensions/             # Official store extensions
  github/               # GitHub search and issue/PR actions
  notion/               # Notion workspace search
  password-generator/   # Crypto-secure password generator (EFF Diceware)
packages/
  api/                  # TypeScript and Rust extension APIs
  cli/                  # volt-plugin CLI tool (init, lint, test, publish)
schemas/                # Manifest and registry JSON schemas
templates/              # Starter templates
examples/               # Educational sample extensions
scripts/                # Store maintenance scripts
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

The CLI prompts for: extension ID, name, description, author, category, permissions, trigger prefix, and keywords. It generates `manifest.json`, `index.ts`, `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, and installs dependencies.

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
- Only these permissions are accepted by Volt: `clipboard`, `network`, `notifications`, `openUrl`, `oauth`, `ai`, `system`
- Runtime commands are backend-gated by installed/enabled extension state and granted permissions.
- `installed.json` is HMAC-signed; a mismatch resets all `granted_permissions` (fail-closed)

## CLI reference

| Command | Description |
|---------|-------------|
| `volt-plugin init` | Scaffold a new extension with interactive prompts |
| `volt-plugin lint` | Run ESLint for one extension |
| `volt-plugin test` | Run manifest validation, schema validation, ESLint, TypeScript, and package dry-run |
| `volt-plugin validate-registry` | Validate `registry.json`, release URLs, and source manifest drift |
| `volt-plugin publish` | Package as ZIP and generate store submission artifacts |

## Contributing

1. Fork this repository
2. Create a branch: `git checkout -b extension/my-extension`
3. Add your extension under `extensions/`
4. Run `volt-plugin test` to validate
5. Run `volt-plugin publish` to generate the package manifest, checksum, registry patch, and PR body
6. Run `volt-plugin validate-registry` if you touch `registry.json`
7. Open a Pull Request

See [Prepare Extension For Store](docs/prepare-extension-for-store.md) and the [Publishing Guide](docs/publishing.md) for the full submission process.

## Documentation

- [Plugin Development Guide](https://voltlaunchr.dev/docs/plugins/development)
- [Prepare Extension For Store](docs/prepare-extension-for-store.md)
- [API Reference](https://voltlaunchr.dev/docs/plugins/api-reference)
- [Best Practices](https://voltlaunchr.dev/docs/plugins/best-practices)
- [Examples](https://voltlaunchr.dev/docs/plugins/examples)
