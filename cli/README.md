# @volt/plugin-cli

CLI tool for creating, testing, and publishing Volt extensions.

## Installation

```bash
npm install -g @volt/plugin-cli
```

Or use directly from the repo:

```bash
cd cli
npm install
npm run build
node bin/volt-plugin.mjs <command>
```

## Commands

### `volt-plugin init [name]`

Create a new Volt extension with interactive prompts.

```bash
volt-plugin init my-awesome-plugin
```

Prompts for: name, description, author, category, permissions, prefix, keywords.

Generates:
- `manifest.json` — extension metadata
- `index.ts` — Plugin class with `canHandle`, `match`, `execute`
- `package.json` — npm package with `@volt/plugin-api` dependency
- `tsconfig.json` — TypeScript configuration

### `volt-plugin test`

Validate your extension from within its directory.

```bash
cd my-awesome-plugin
volt-plugin test
```

Checks:
- **Manifest validation** — required fields, valid values
- **Plugin interface** — default export with `canHandle`, `match`, `execute` methods
- **TypeScript** — `tsc --noEmit` type checking

### `volt-plugin publish`

Package your extension for distribution.

```bash
cd my-awesome-plugin
volt-plugin publish
```

Creates:
- ZIP package (`<id>-v<version>.zip`)
- Registry entry JSON for `registry.json`
- Step-by-step PR submission instructions

## Extension Structure

```
my-extension/
├── manifest.json    # Metadata (id, name, version, permissions, etc.)
├── index.ts         # Entry point implementing Plugin interface
├── package.json     # Dependencies
└── tsconfig.json    # TypeScript config
```

## Manifest Format

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

**Categories:** productivity, utilities, development, media, social, finance, games, other

**Permissions:** clipboard, filesystem, network, shell, notifications

## Development

```bash
npm install
npm run build    # Compile TypeScript
npm test         # Run tests
npm run dev      # Watch mode
```
