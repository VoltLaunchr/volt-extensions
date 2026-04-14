import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TemplateOptions {
  id: string;
  name: string;
  description: string;
  author: { name: string; github?: string };
  category: string;
  permissions: string[];
  prefix?: string;
  keywords: string[];
}

function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function resolveTemplatePath(): string {
  // When running from source (dev): cli/src/utils/ → cli/ → templates/typescript-plugin/
  // When running from dist: cli/dist/utils/ → cli/ → templates/typescript-plugin/
  const candidates = [
    join(__dirname, '..', '..', '..', 'templates', 'typescript-plugin'),
    join(__dirname, '..', '..', 'templates', 'typescript-plugin'),
    join(__dirname, '..', '..', '..', '..', 'templates', 'typescript-plugin'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  // Fallback: embedded template dir in dist
  const embedded = join(__dirname, '..', 'templates', 'typescript-plugin');
  if (existsSync(embedded)) return embedded;
  throw new Error(
    'Could not find template directory. Make sure you are in the volt-extensions repo or the CLI is properly installed.'
  );
}

export function generateManifest(opts: TemplateOptions): string {
  const manifest: Record<string, unknown> = {
    id: opts.id,
    name: opts.name,
    version: '1.0.0',
    description: opts.description,
    author: opts.author,
    main: 'index.ts',
    category: opts.category,
  };

  if (opts.keywords.length > 0) {
    manifest.keywords = opts.keywords;
  }
  if (opts.prefix) {
    manifest.prefix = opts.prefix;
  }
  if (opts.permissions.length > 0) {
    manifest.permissions = opts.permissions;
  } else {
    manifest.permissions = [];
  }
  manifest.files = ['index.ts'];

  return JSON.stringify(manifest, null, 2) + '\n';
}

export function generateIndexTs(opts: TemplateOptions): string {
  const className = toPascalCase(opts.id) + 'Plugin';
  const hasPrefix = !!opts.prefix;

  const canHandleBody = hasPrefix
    ? `    const q = context.query.toLowerCase();
    return q.startsWith('${opts.prefix}');`
    : `    return context.query.length > 0;`;

  return `import {
  Plugin,
  PluginContext,
  PluginResult,
  PluginResultType,
} from '@voltlaunchrr/plugin-api';

export class ${className} implements Plugin {
  id = '${opts.id}';
  name = '${opts.name}';
  description = '${opts.description}';
  enabled = true;

  canHandle(context: PluginContext): boolean {
${canHandleBody}
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    return [
      {
        id: '${opts.id}-result',
        type: PluginResultType.Info,
        title: '${opts.name}',
        subtitle: \`Query: \${context.query}\`,
        score: 80,
        data: { query: context.query },
      },
    ];
  }

  async execute(result: PluginResult): Promise<void> {
    // TODO: Implement your action here
    console.log('Executed:', result);
  }
}

export default ${className};
`;
}

export function generatePackageJson(opts: TemplateOptions): string {
  const pkg = {
    name: opts.id,
    version: '1.0.0',
    description: opts.description,
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      watch: 'tsc --watch',
    },
    keywords: ['volt', 'plugin', ...opts.keywords],
    author: opts.author.name,
    license: 'MIT',
    dependencies: {
      '@voltlaunchrr/plugin-api': '^0.1.0',
    },
    devDependencies: {
      typescript: '^5.3.3',
    },
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}

export function scaffoldExtension(
  targetDir: string,
  opts: TemplateOptions
): void {
  // Create target directory
  mkdirSync(targetDir, { recursive: true });

  // Copy tsconfig.json from template
  const templateDir = resolveTemplatePath();
  const tsconfigSrc = join(templateDir, 'tsconfig.json');
  if (existsSync(tsconfigSrc)) {
    copyFileSync(tsconfigSrc, join(targetDir, 'tsconfig.json'));
  } else {
    // Fallback minimal tsconfig
    writeFileSync(
      join(targetDir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            module: 'ESNext',
            lib: ['ES2020'],
            outDir: './dist',
            rootDir: '.',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            moduleResolution: 'node',
          },
          include: ['**/*'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2
      ) + '\n'
    );
  }

  // Generate manifest.json
  writeFileSync(join(targetDir, 'manifest.json'), generateManifest(opts));

  // Generate index.ts
  writeFileSync(join(targetDir, 'index.ts'), generateIndexTs(opts));

  // Generate package.json
  writeFileSync(join(targetDir, 'package.json'), generatePackageJson(opts));
}
