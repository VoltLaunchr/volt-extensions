# TypeScript API

Detailed guide for building TypeScript plugins for Volt.

## Installation

```bash
npm install @voltlaunchrr/plugin-api
```

## Project Setup

### 1. Initialize your project

```bash
mkdir my-volt-plugin
cd my-volt-plugin
npm init -y
npm install @voltlaunchrr/plugin-api
npm install -D typescript @types/node
```

### 2. Create manifest.json

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Does something useful",
  "author": {
    "name": "Your Name",
    "github": "yourusername"
  },
  "main": "index.ts",
  "category": "utilities",
  "keywords": ["my", "plugin"]
}
```

### 3. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Create your plugin

Create `src/index.ts`:

```typescript
import {
  Plugin,
  PluginContext,
  PluginResult,
  PluginResultType,
} from '@voltlaunchrr/plugin-api';

export class MyPlugin implements Plugin {
  id = 'my-plugin';
  name = 'My Plugin';
  description = 'Does something useful';
  enabled = true;

  canHandle(context: PluginContext): boolean {
    return context.query.length > 0;
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    return [
      {
        id: 'result-1',
        type: PluginResultType.Info,
        title: 'My Result',
        subtitle: context.query,
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

## Advanced Features

### State Management

Store state between queries using a cache:

```typescript
export class StatefulPlugin implements Plugin {
  private cache = new Map<string, PluginResult[]>();

  async match(context: PluginContext): Promise<PluginResult[]> {
    const cached = this.cache.get(context.query);
    if (cached) return cached;

    const results = await this.fetchResults(context.query);
    this.cache.set(context.query, results);
    return results;
  }
}
```

### Settings Support

Access user-configured settings via `context.settings`:

```typescript
canHandle(context: PluginContext): boolean {
  const enabled = context.settings?.enabled ?? true;
  return enabled && context.query.length > 0;
}
```

### Data Passing (match -> execute)

Use the `data` field on `PluginResult` to pass arbitrary context from `match()` to `execute()`:

```typescript
match(context: PluginContext): PluginResult[] {
  return [{
    id: 'result-1',
    type: PluginResultType.Info,
    title: 'Copy this value',
    score: 100,
    data: { value: 'my-computed-value', action: 'copy' },
  }];
}

async execute(result: PluginResult): Promise<void> {
  const value = result.data?.value as string;
  // e.g. copy to clipboard via VoltAPI
}
```

### React Components

Plugins can export React components for custom UI rendering (see the [Calculator example](../examples/calculator/) for a real implementation):

```tsx
import React from 'react';

// Export a named view component alongside your plugin
export const MyPluginView: React.FC<{ result: PluginResult }> = ({ result }) => {
  return (
    <div className="my-plugin-view">
      <h3>{result.title}</h3>
      <p>{result.subtitle}</p>
    </div>
  );
};
```

### Volt Runtime API

Extensions can access Volt's runtime utilities through `window.VoltAPI`:

```typescript
async execute(result: PluginResult): Promise<void> {
  const password = result.data?.password as string;

  // Clipboard access (requires "clipboard" permission in manifest)
  const copyToClipboard = (window as any).VoltAPI?.utils?.copyToClipboard;
  if (copyToClipboard) {
    await copyToClipboard(password);
  }
}
```

### Parser Pattern

For complex plugins, separate query parsing from result generation. This is the pattern used by Calculator and Password Generator:

```typescript
// parsers/queryParser.ts
export function detectQueryType(query: string): QueryType | null { ... }
export function parseQuery(query: string): ParsedQuery | null { ... }

// index.ts
canHandle(context: PluginContext): boolean {
  return detectQueryType(context.query.trim()) !== null;
}

match(context: PluginContext): PluginResult[] | null {
  const parsed = parseQuery(context.query.trim());
  if (!parsed) return null;
  // Route to handler based on parsed.type
}
```

## Recommended Project Structure

Simple plugin (single file):
```
my-plugin/
├── manifest.json
├── index.ts
└── README.md
```

Complex plugin (multi-file):
```
my-plugin/
├── manifest.json
├── index.ts              # Main Plugin class
├── types.ts              # Type definitions
├── parsers/
│   └── queryParser.ts    # Query detection and parsing
├── utils/
│   └── ...               # Business logic helpers
├── components/
│   └── MyView.tsx        # React UI component
└── README.md
```

## Testing

```typescript
import { MyPlugin } from './index';

describe('MyPlugin', () => {
  const plugin = new MyPlugin();

  it('should handle matching queries', () => {
    expect(plugin.canHandle({ query: 'test' })).toBe(true);
  });

  it('should not handle empty queries', () => {
    expect(plugin.canHandle({ query: '' })).toBe(false);
  });

  it('should return results', async () => {
    const results = await plugin.match({ query: 'test' });
    expect(results).not.toBeNull();
    expect(results!.length).toBeGreaterThan(0);
  });

  it('should have valid result structure', async () => {
    const results = await plugin.match({ query: 'test' });
    const result = results![0];
    expect(result.id).toBeDefined();
    expect(result.type).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
```

## See Also

- [Plugin API Reference](plugin-api.md) - Full interface and type documentation
- [Examples](../examples/) - Working plugins (Calculator, Password Generator, Web Search)
- [Dev Workflow](dev-workflow.md) - Hot reload and dev extension linking
- [Publishing Guide](publishing.md) - Share your plugin
