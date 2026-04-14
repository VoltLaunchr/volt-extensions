# @voltlaunchrr/plugin-cli

CLI tool for creating, validating, and packaging Volt extensions.

## Quick Start

```bash
npm install -g @voltlaunchrr/plugin-cli
# or: bun add -g @voltlaunchrr/plugin-cli
# or: pnpm add -g @voltlaunchrr/plugin-cli

volt-plugin init my-extension    # Scaffold a new extension
volt-plugin test                 # Validate manifest, interface, and types
volt-plugin publish              # Package and generate registry entry
```

## Commands

| Command | Description |
|---------|-------------|
| `init [name]` | Scaffold a new extension with interactive prompts |
| `test` | Validate manifest, plugin interface, and TypeScript types |
| `publish` | Create ZIP package and generate registry entry |

## Full Documentation

See [docs/cli.md](../docs/cli.md) for the complete reference including manifest format, categories, permissions, and development setup.
