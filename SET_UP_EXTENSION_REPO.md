# Instructions pour configurer volt-extensions

## Contexte

Je suis en train de créer un repo public **volt-extensions** pour l'API des plugins de Volt launcher (similaire au modèle Raycast). Le repo principal Volt reste privé, seule l'API des plugins et les exemples sont open source.

**Repo GitHub** : `https://github.com/VoltLaunchr/volt-extensions`

## État actuel

J'ai déjà exécuté ces commandes pour copier les fichiers de base :

```powershell
cd d:\dev
mkdir volt-extensions
cd volt-extensions
git init

# Structure créée
mkdir -p api\typescript\src
mkdir -p api\rust\src
mkdir -p examples
mkdir -p docs
mkdir -p templates

# Fichiers copiés depuis Volt
Copy-Item "d:\dev\Volt\src\features\plugins\types\index.ts" "api\typescript\src\types.ts"
Copy-Item "d:\dev\Volt\src\features\plugins\core\registry.ts" "api\typescript\src\registry.ts"
Copy-Item "d:\dev\Volt\src-tauri\src\plugins\api.rs" "api\rust\src\api.rs"
Copy-Item "d:\dev\Volt\src-tauri\src\plugins\registry.rs" "api\rust\src\registry.rs"
Copy-Item -Recurse "d:\dev\Volt\src\features\plugins\builtin\calculator" "examples\calculator"
Copy-Item -Recurse "d:\dev\Volt\src\features\plugins\builtin\websearch" "examples\websearch"
```

## Structure finale souhaitée

```
volt-extensions/
├── README.md                          # Présentation générale
├── LICENSE                            # MIT License
├── .gitignore
│
├── docs/
│   ├── getting-started.md            # Comment créer son premier plugin
│   ├── plugin-api.md                 # Documentation complète de l'API
│   ├── typescript-api.md             # API TypeScript (frontend)
│   ├── rust-api.md                   # API Rust (backend - optionnel)
│   └── publishing.md                 # Comment publier une extension
│
├── api/
│   ├── typescript/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts              # Re-export tout
│   │       ├── types.ts              # Types copiés (déjà fait)
│   │       └── registry.ts           # Registry copié (déjà fait)
│   │
│   └── rust/
│       ├── Cargo.toml
│       ├── README.md
│       └── src/
│           ├── lib.rs
│           ├── api.rs                # Copié (déjà fait)
│           └── registry.rs           # Copié (déjà fait)
│
├── examples/
│   ├── calculator/                   # Copié (déjà fait)
│   │   ├── index.ts
│   │   └── README.md                 # À créer
│   │
│   └── websearch/                    # Copié (déjà fait)
│       ├── index.ts
│       └── README.md                 # À créer
│
├── templates/
│   ├── typescript-plugin/            # Template complet pour nouveau plugin
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── README.md
│   │
│   └── rust-plugin/                  # Template Rust (optionnel)
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
│
└── community/
    └── README.md                     # Comment soumettre une extension
```

## Fichiers à créer

### 1. Configuration TypeScript

**`api/typescript/package.json`** :

```json
{
  "name": "@volt/plugin-api",
  "version": "0.1.0",
  "description": "Plugin API for Volt launcher extensions",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["volt", "launcher", "plugin", "extension"],
  "author": "VoltLaunchr",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/VoltLaunchr/volt-extensions"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

**`api/typescript/tsconfig.json`** :

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**`api/typescript/src/index.ts`** :

```typescript
// Re-export all types and utilities
export * from "./types";
export * from "./registry";
```

**`api/typescript/README.md`** :

```markdown
# @volt/plugin-api

TypeScript API for building Volt launcher plugins.

## Installation

\`\`\`bash
npm install @volt/plugin-api
\`\`\`

## Usage

\`\`\`typescript
import { Plugin, PluginContext, PluginResult } from '@volt/plugin-api';

export class MyPlugin implements Plugin {
id = 'my-plugin';
name = 'My Plugin';
description = 'My awesome plugin';
enabled = true;

canHandle(context: PluginContext): boolean {
return context.query.length > 0;
}

async match(context: PluginContext): Promise<PluginResult[]> {
return [{
id: 'result-1',
type: 'info',
title: 'Hello!',
score: 100,
}];
}

async execute(result: PluginResult): Promise<void> {
console.log('Executed!');
}
}
\`\`\`

See [docs](../../docs/) for full documentation.
```

### 2. Configuration Rust

**`api/rust/Cargo.toml`** :

```toml
[package]
name = "volt-plugin-api"
version = "0.1.0"
edition = "2021"
authors = ["VoltLaunchr"]
description = "Plugin API for Volt launcher extensions"
license = "MIT"
repository = "https://github.com/VoltLaunchr/volt-extensions"
keywords = ["volt", "launcher", "plugin", "extension"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[lib]
crate-type = ["cdylib", "rlib"]
```

**`api/rust/src/lib.rs`** :

```rust
//! Volt Plugin API
//!
//! This crate provides the core API for building Volt launcher plugins.

pub mod api;
pub mod registry;

pub use api::VoltPluginAPI;
pub use registry::PluginRegistry;
```

**`api/rust/README.md`** :

```markdown
# volt-plugin-api

Rust API for building Volt launcher backend plugins.

## Usage

Add to your \`Cargo.toml\`:

\`\`\`toml
[dependencies]
volt-plugin-api = "0.1"
\`\`\`

See [docs](../../docs/) for full documentation.
```

### 3. README principal

**`README.md`** :

```markdown
# Volt Extensions

Official extension API and community plugins for [Volt launcher](https://github.com/VoltLaunchr/Volt).

## 🚀 What is Volt?

Volt is a fast, modern desktop launcher for Windows, macOS, and Linux. Like Raycast or Alfred, but open-source and extensible.

## 📦 Plugin API

Build your own plugins using our TypeScript or Rust API:

### TypeScript (Frontend Plugins)

\`\`\`bash
npm install @volt/plugin-api
\`\`\`

\`\`\`typescript
import { Plugin, PluginContext, PluginResult } from '@volt/plugin-api';

export class MyPlugin implements Plugin {
id = 'my-plugin';
name = 'My Plugin';
description = 'Does something cool';
enabled = true;

canHandle(context: PluginContext): boolean {
return context.query.startsWith('my:');
}

async match(context: PluginContext): Promise<PluginResult[]> {
return [{
id: 'result-1',
type: 'info',
title: 'Hello from my plugin!',
subtitle: 'Query: ' + context.query,
score: 100,
}];
}

async execute(result: PluginResult): Promise<void> {
console.log('Executed:', result.title);
}
}
\`\`\`

### Rust (Backend Plugins)

\`\`\`toml
[dependencies]
volt-plugin-api = "0.1"
\`\`\`

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
```

### 4. .gitignore

**`.gitignore`** :

```
# Dependencies
node_modules/
target/

# Build outputs
dist/
build/
*.log

# Package managers
package-lock.json
yarn.lock
Cargo.lock

# IDEs
.vscode/
.idea/
*.swp
*.swo
*.sublime-*

# OS
.DS_Store
Thumbs.db
Desktop.ini

# Env files
.env
.env.local
```

### 5. LICENSE

**`LICENSE`** :

```
MIT License

Copyright (c) 2025 VoltLaunchr

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 6. Documentation de base

**`docs/getting-started.md`** :

```markdown
# Getting Started with Volt Extensions

Learn how to create your first Volt plugin in 5 minutes.

## Prerequisites

- Node.js 18+ (for TypeScript plugins)
- Volt launcher installed
- Basic TypeScript/JavaScript knowledge

## Create Your First Plugin

### 1. Install the API

\`\`\`bash
npm install @volt/plugin-api
\`\`\`

### 2. Create the Plugin

Create a file \`my-plugin.ts\`:

\`\`\`typescript
import { Plugin, PluginContext, PluginResult, PluginResultType } from '@volt/plugin-api';

export class MyPlugin implements Plugin {
id = 'my-plugin';
name = 'My First Plugin';
description = 'A simple example plugin';
enabled = true;

canHandle(context: PluginContext): boolean {
// Only handle queries starting with "hello"
return context.query.toLowerCase().startsWith('hello');
}

async match(context: PluginContext): Promise<PluginResult[]> {
const query = context.query.toLowerCase();

    return [{
      id: 'hello-result',
      type: PluginResultType.Info,
      title: 'Hello, Volt!',
      subtitle: 'You searched for: ' + query,
      icon: '👋',
      score: 100,
      data: { message: 'Hello from my plugin!' }
    }];

}

async execute(result: PluginResult): Promise<void> {
// Do something when the result is selected
console.log('Plugin executed:', result.data?.message);
alert('Hello from your plugin!');
}
}
\`\`\`

### 3. Test Your Plugin

1. Build your plugin: \`npm run build\`
2. Copy the built file to Volt's plugin directory
3. Restart Volt
4. Type "hello" in the search bar
5. See your plugin result!

## Next Steps

- Read the [Plugin API Reference](plugin-api.md)
- Check out [Examples](../examples/)
- Learn about [Publishing](publishing.md)
```

**`docs/plugin-api.md`** :

```markdown
# Plugin API Reference

Complete reference for the Volt Plugin API.

## Core Interfaces

### Plugin

The main interface for all plugins.

\`\`\`typescript
interface Plugin {
// Unique identifier (lowercase, no spaces)
id: string;

// Display name
name: string;

// Short description
description: string;

// Whether plugin is enabled
enabled: boolean;

// Check if plugin can handle this query
canHandle(context: PluginContext): boolean;

// Generate results for the query
match(context: PluginContext): Promise<PluginResult[]> | PluginResult[] | null;

// Execute when user selects a result
execute(result: PluginResult): Promise<void> | void;
}
\`\`\`

### PluginContext

Context passed to plugin methods.

\`\`\`typescript
interface PluginContext {
// User's search query
query: string;

// Optional plugin settings
settings?: Record<string, unknown>;
}
\`\`\`

### PluginResult

Result returned by a plugin.

\`\`\`typescript
interface PluginResult {
// Unique ID for this result
id: string;

// Result type (calculator, websearch, etc.)
type: PluginResultType;

// Main text displayed
title: string;

// Secondary text (optional)
subtitle?: string;

// Icon (emoji or path)
icon?: string;

// Badge text (e.g., "Plugin")
badge?: string;

// Score for ranking (higher = better)
score: number;

// Additional data for execute()
data?: Record<string, unknown>;

// Plugin that created this result
pluginId?: string;
}
\`\`\`

### PluginResultType

\`\`\`typescript
enum PluginResultType {
Calculator = 'calculator',
WebSearch = 'websearch',
SystemCommand = 'systemcommand',
FileExplorer = 'fileexplorer',
Timer = 'timer',
SystemMonitor = 'systemmonitor',
Steam = 'steam',
Game = 'game',
Clipboard = 'clipboard',
Emoji = 'emoji',
Info = 'info',
}
\`\`\`

## Best Practices

### Performance

- Keep \`canHandle()\` fast (< 1ms)
- Cache expensive data
- Use async operations for network requests
- Limit results to 5-10 items

### Scoring

- Use 90-100 for exact matches
- Use 70-89 for strong matches
- Use 50-69 for partial matches
- Use < 50 for weak matches

### Error Handling

\`\`\`typescript
async match(context: PluginContext): Promise<PluginResult[]> {
try {
// Your logic here
return results;
} catch (error) {
console.error('Plugin error:', error);
return []; // Return empty on error
}
}
\`\`\`

## Examples

See [examples/](../examples/) for complete working plugins.
```

**`docs/publishing.md`** :

```markdown
# Publishing Your Extension

Share your plugin with the Volt community!

## Prerequisites

- Working plugin tested locally
- GitHub account
- README.md for your plugin

## Submission Process

### 1. Fork this repo

\`\`\`bash

# Fork on GitHub, then:

git clone https://github.com/YOUR_USERNAME/volt-extensions.git
\`\`\`

### 2. Add your plugin

\`\`\`bash
cd volt-extensions/community
mkdir your-plugin-name
cd your-plugin-name

# Add your plugin files

\`\`\`

### 3. Create a README

Include:

- Plugin name and description
- Installation instructions
- Usage examples
- Screenshots (if applicable)
- Author/license info

### 4. Submit a PR

\`\`\`bash
git checkout -b add-your-plugin-name
git add .
git commit -m "Add YourPluginName extension"
git push origin add-your-plugin-name
\`\`\`

Then create a Pull Request on GitHub.

## Guidelines

✅ **Do:**

- Test your plugin thoroughly
- Include clear documentation
- Follow the code style
- Add error handling
- Keep dependencies minimal

❌ **Don't:**

- Submit malicious code
- Include API keys/secrets
- Use excessive resources
- Violate third-party ToS

## Review Process

1. Automated checks run
2. Maintainer reviews code
3. Feedback provided (if needed)
4. Merged and published

Your plugin will appear in the Volt extensions store!

## Need Help?

- Open an [issue](https://github.com/VoltLaunchr/volt-extensions/issues)
- Ask in [Discord](https://discord.gg/volt) (coming soon)
```

### 7. Exemples README

**`examples/calculator/README.md`** :

```markdown
# Calculator Plugin

Simple calculator plugin for Volt.

## Features

- Basic math operations (+, -, \*, /)
- Works with natural language
- Instant results as you type

## Usage

Type any math expression:

- \`2 + 2\` → 4
- \`15 \* 3\` → 45
- \`100 / 4\` → 25

## Code

See [index.ts](index.ts) for the implementation.
```

**`examples/websearch/README.md`** :

```markdown
# Web Search Plugin

Search the web directly from Volt.

## Features

- Google search integration
- Quick access to search engines
- Opens in default browser

## Usage

Type \`?\` followed by your query:

- \`? weather paris\` → Search Google
- \`? github copilot\` → Search for GitHub Copilot

## Code

See [index.ts](index.ts) for the implementation.
```

### 8. Community guidelines

**`community/README.md`** :

```markdown
# Community Extensions

Welcome to the Volt extensions community!

## Browse Extensions

Coming soon: List of community plugins

## Submit Your Extension

See [Publishing Guide](../docs/publishing.md) for how to submit.

## Guidelines

- Be respectful
- Test your code
- Document clearly
- Help others

## Support

Need help? Open an [issue](https://github.com/VoltLaunchr/volt-extensions/issues)!
```

## Ce que l'AI doit faire

1. **Créer tous les fichiers listés ci-dessus** dans le repo `volt-extensions` (chemin: `d:\dev\volt-extensions`)

2. **Vérifier que la structure est correcte** :

   - api/typescript avec package.json, tsconfig.json, src/index.ts
   - api/rust avec Cargo.toml, src/lib.rs
   - docs/ avec les 4-5 fichiers de doc
   - examples/ avec les READMEs
   - README.md principal, LICENSE, .gitignore

3. **Initialiser Git et pousser** :

   ```bash
   cd d:\dev\volt-extensions
   git add .
   git commit -m "Initial commit: Volt Plugin API and documentation"
   git remote add origin https://github.com/VoltLaunchr/volt-extensions.git
   git branch -M main
   git push -u origin main
   ```

4. **Optionnel : Publier sur npm** (plus tard)
   ```bash
   cd api/typescript
   npm publish --access public
   ```

## Notes importantes

- Le repo doit être **public**
- License: **MIT**
- Owner: **VoltLaunchr**
- Tout le code est déjà copié, il faut juste créer les fichiers de config et doc
- Style de doc: Simple, clair, avec exemples (comme Raycast)

## Questions à clarifier avec l'AI

- Est-ce que tous les fichiers sont bien créés ?
- Est-ce que la structure est logique ?
- Manque-t-il quelque chose d'important ?
- Les exemples sont-ils clairs ?

## Résultat attendu

Un repo propre, documenté et prêt à recevoir des contributions de la communauté, avec une API claire pour développer des plugins Volt.
