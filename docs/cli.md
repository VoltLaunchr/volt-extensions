# Volt Plugin CLI

Command-line tool for creating, validating, and packaging Volt extensions.

## Installation

Install globally via npm:

```bash
npm install -g @voltlaunchrr/plugin-cli
# or: bun add -g @voltlaunchrr/plugin-cli
# or: pnpm add -g @voltlaunchrr/plugin-cli
```

Or run directly from the repository:

```bash
cd cli
npm install
npm run build
node bin/volt-plugin.mjs <command>
```

## Commands

### init

Scaffold a new extension with interactive prompts.

```bash
volt-plugin init [name]
```

The wizard prompts for:

| Field | Description | Example |
|-------|-------------|---------|
| Extension ID | Unique kebab-case identifier | `my-plugin` |
| Display name | Human-readable name | `My Plugin` |
| Description | Short summary | `Converts currencies` |
| Author name | Your name (defaults to git config) | `Jane Doe` |
| GitHub username | Optional, for attribution | `janedoe` |
| Category | Extension category | `utilities` |
| Permissions | Required capabilities | `clipboard`, `network` |
| Trigger prefix | Optional activation keyword | `convert` |
| Keywords | Comma-separated search terms | `currency, money, exchange` |

Generated files:

```
my-plugin/
├── manifest.json    Extension metadata
├── index.ts         Plugin implementation with canHandle, match, execute
├── package.json     npm package with @voltlaunchrr/plugin-api dependency
└── tsconfig.json    TypeScript configuration
```

Dependencies are installed automatically using whichever package manager is detected (bun, pnpm, or npm).

### test

Validate an extension from within its directory.

```bash
cd my-plugin
volt-plugin test
```

Runs three checks in sequence:

1. **Manifest validation** — verifies all required fields (`id`, `name`, `version`, `description`, `author`, `main`), valid category, valid permissions, kebab-case ID format
2. **Plugin interface** — checks that the entry point has a default export and implements `canHandle()`, `match()`, `execute()`
3. **TypeScript** — runs `tsc --noEmit` to catch type errors without emitting files

Exits with code 1 if any check fails.

### publish

Package an extension for distribution and generate a registry entry.

```bash
cd my-plugin
volt-plugin publish
```

Steps performed:

1. Validates the manifest (same checks as `test`)
2. Creates a ZIP archive named `{id}-v{version}.zip` containing the extension files
3. Prints a JSON registry entry to add to `registry.json`
4. Outputs step-by-step instructions for submitting to the extension store

The output includes the exact PR workflow:

```
1. Fork VoltLaunchr/volt-extensions on GitHub
2. Create a GitHub release with tag: {id}-v{version}
3. Upload the ZIP to the release
4. Add the registry entry to registry.json
5. Submit a pull request
```

## Manifest Reference

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "What it does",
  "author": { "name": "Your Name", "github": "username" },
  "main": "index.ts",
  "category": "utilities",
  "keywords": ["trigger", "words"],
  "prefix": "mp",
  "permissions": ["clipboard"],
  "files": ["index.ts"]
}
```

### Categories

`productivity`, `utilities`, `development`, `media`, `social`, `finance`, `games`, `other`

### Permissions

| Permission | Description |
|-----------|-------------|
| `clipboard` | Read/write system clipboard |
| `filesystem` | Access local files through Volt API |
| `network` | Make HTTP requests |
| `shell` | Execute shell commands |
| `notifications` | Show system notifications |

## Development

```bash
cd cli
npm install
npm run build     # Compile TypeScript
npm test          # Run test suite
npm run dev       # Watch mode
```

## See Also

- [Getting Started](getting-started.md) — Create your first extension
- [Plugin API Reference](plugin-api.md) — Full interface documentation
- [Dev Workflow](dev-workflow.md) — Hot reload and local testing
- [Publishing](publishing.md) — Submit to the extension store
