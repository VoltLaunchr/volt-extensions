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
cd packages/cli
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

| Field           | Description                        | Example                     |
| --------------- | ---------------------------------- | --------------------------- |
| Extension ID    | Unique kebab-case identifier       | `my-plugin`                 |
| Display name    | Human-readable name                | `My Plugin`                 |
| Description     | Short summary                      | `Converts currencies`       |
| Author name     | Your name (defaults to git config) | `Jane Doe`                  |
| GitHub username | Optional, for attribution          | `janedoe`                   |
| Category        | Extension category                 | `utilities`                 |
| Permissions     | Required capabilities              | `clipboard`, `network`      |
| Trigger prefix  | Optional activation keyword        | `convert`                   |
| Keywords        | Comma-separated search terms       | `currency, money, exchange` |

Generated files:

```
my-plugin/
├── manifest.json    Extension metadata
├── index.ts         Plugin implementation with canHandle, match, execute
├── eslint.config.js ESLint flat config
├── .prettierrc      Prettier formatting config
├── package.json     npm package with @voltlaunchrr/plugin-api dependency
└── tsconfig.json    TypeScript configuration
```

Dependencies are installed automatically using whichever package manager is detected (bun, pnpm, or npm).

### lint

Run ESLint for an extension.

```bash
cd my-plugin
volt-plugin lint
```

For CI or monorepo usage:

```bash
volt-plugin lint --dir extensions/github
```

`volt-plugin lint` delegates to the extension's local ESLint configuration. Volt-specific rules live in the dedicated `@voltlaunchrr/eslint-plugin` and `@voltlaunchrr/eslint-config` packages. Until those packages are published to npm, generated extensions keep the local standard flat config and must not declare an unavailable npm dependency.

### test

Validate an extension from within its directory.

```bash
cd my-plugin
volt-plugin test
```

For CI or monorepo usage:

```bash
volt-plugin test --dir extensions/github
```

Runs checks in sequence:

1. **Manifest validation** — verifies all required fields (`id`, `name`, `version`, `description`, `author`, `main`), valid category, valid permissions, kebab-case ID format
2. **JSON Schema validation** — validates `manifest.json` against `schemas/manifest.schema.json`
3. **Plugin interface** — checks that the entry point has a default export and implements `canHandle()`, `match()`, `execute()`
4. **ESLint** — runs the extension's local ESLint config
5. **TypeScript** — runs `tsc --noEmit` to catch type errors without emitting files
6. **Package dry-run** — verifies the package file list and rejects forbidden files

Exits with code 1 if any check fails.

### publish

Package an extension for store review and generate submission artifacts.

```bash
cd my-plugin
volt-plugin publish
```

For CI or monorepo usage:

```bash
volt-plugin publish --dir extensions/github --out-dir .volt-publish/github-v1.2.1
```

Steps performed:

1. Validates the manifest (same checks as `test`)
2. Checks optional `metadata/` assets for store listing quality
3. Creates a ZIP archive named `{id}-v{version}.zip` containing the extension files
4. Computes the archive SHA-256 checksum
5. Writes machine-readable review artifacts under `.volt-publish/{id}-v{version}/`
6. Outputs the review-first PR workflow

Generated files:

```
.volt-publish/{id}-v{version}/
├── artifacts/{id}-v{version}.zip
├── package-manifest.json
├── pull-request-body.md
├── registry-entry.json
├── registry-patch.json
└── submission.json
```

Review flow:

```
1. Commit the extension source under `extensions/`.
2. Include or attach submission.json in the PR.
3. Maintainers review the source, registry patch, package manifest, and checksum.
4. After merge, the release workflow publishes the archive.
```

### `volt-plugin validate-registry`

Validate the public store registry from the repo root or any subdirectory:

```bash
volt-plugin validate-registry
```

Checks performed:

1. Validates `registry.json` against `schemas/registry.schema.json`
2. Verifies release URLs use the `{id}-v{version}` tag and a supported archive format
3. Rejects duplicate extension IDs
4. Compares registry manifests with local source manifests under `extensions/`, `community/`, `examples/`, and legacy `plugins/`

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
  "commands": [
    {
      "name": "search",
      "title": "Search",
      "prefix": "mp"
    }
  ],
  "backgroundRefresh": { "interval": "5m" },
  "files": ["index.ts", "manifest.json"]
}
```

### Categories

`productivity`, `utilities`, `developer`, `media`, `social`, `finance`, `games`, `system`, `other`

### Permissions

| Permission      | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `clipboard`     | Read/write system clipboard                                        |
| `network`       | Make HTTP requests                                                 |
| `notifications` | Show system notifications                                          |
| `openUrl`       | Open links in the default browser                                  |
| `oauth`         | Run OAuth PKCE flows and read extension OAuth tokens               |
| `ai`            | Call configured AI providers through Volt                          |
| `system`        | List installed applications, reveal files, and move files to Trash |

## Development

```bash
cd packages/cli
npm install
npm run build     # Compile TypeScript
npm test          # Run test suite
npm run dev       # Watch mode
```

## See Also

- [Getting Started](getting-started.md) — Create your first extension
- [Plugin API Reference](plugin-api.md) — Full interface documentation
- [Dev Workflow](dev-workflow.md) — Hot reload and local testing
- [Prepare Extension For Store](prepare-extension-for-store.md) — Store review checklist
- [Publishing](publishing.md) — Submit to the extension store
