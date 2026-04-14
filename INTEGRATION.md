# Volt Extensions Integration Guide

## Overview

This guide explains how the new GitHub and Notion plugins are integrated into Volt.

## Plugins Added

### 1. GitHub Plugin (`id: github`)
**Prefix:** `gh:`
**Category:** Productivity
**Permissions:** network

**Features:**
- Search GitHub repositories with filters
- Search issues and pull requests
- Search gists
- View trending repositories
- Browse user repositories

**Usage:**
```
gh: repos nodejs
gh: issues is:pr author:torvalds
gh: gists filename:package.json
gh: trending python
gh: user:torvalds
```

### 2. Notion Plugin (`id: notion`)
**Prefix:** `notion:` or `n:`
**Category:** Productivity
**Permissions:** network

**Features:**
- Full-text search across Notion workspace
- List all databases
- Query database items
- View recent pages
- Browse page blocks

**Usage:**
```
notion: my project
notion: databases
notion: recent
notion: db: Tasks
```

## Integration Architecture

### Web Worker Sandbox

Both plugins are configured to run in Volt's Web Worker sandbox:
- **Trigger:** Via `prefix` field in manifest (e.g., `gh:` for GitHub)
- **Sandbox:** Dedicated Worker thread with 500ms timeout
- **Communication:** postMessage IPC between main thread and worker
- **Permissions:** Network access granted via manifest

### Registry Configuration

Both plugins are registered in the Volt Extensions Registry:
- **Location:** `https://raw.githubusercontent.com/VoltLaunchr/volt-extensions/main/registry.json`
- **Status:** Both marked as `"featured": true`
- **Category:** Productivity
- **Distribution:** Automatic discovery via Volt's extension store

### Installation Flow

1. **User Opens Extension Store** → Volt fetches registry.json
2. **Featured Tab** → GitHub and Notion plugins displayed prominently
3. **User Clicks Install** → Plugin ZIP downloaded from GitHub Releases
4. **Permission Consent** → User grants network permissions
5. **Plugin Loaded** → Extension runs in Web Worker on activation

## Manifest Requirements

Both plugins satisfy Volt's requirements:

```json
{
  "id": "github",                          // Unique ID
  "name": "GitHub",                        // Display name
  "version": "1.0.0",                      // Semantic versioning
  "description": "...",                    // Short description
  "author": { "name": "...", "github": "..." },
  "main": "src/index.ts",                  // Entry point
  "prefix": "gh",                          // Web Worker trigger
  "category": "productivity",              // Browsable category
  "keywords": ["github", "search", "..."], // Searchable keywords
  "permissions": ["network"],              // Required capabilities
  "minVoltVersion": "0.4.0"                // Compatibility
}
```

## Source Files Structure

### GitHub Plugin
```
plugins/github/
├── manifest.json       # Metadata
├── package.json        # npm dependencies
├── tsconfig.json       # TypeScript config
├── README.md           # User documentation
├── src/
│   ├── index.ts        # Main plugin class
│   └── github-api.ts   # GitHub API client
└── dist/
    ├── index.js        # Compiled output
    └── github-api.js   # Compiled API
```

### Notion Plugin
```
plugins/notion/
├── manifest.json       # Metadata
├── package.json        # npm dependencies
├── tsconfig.json       # TypeScript config
├── README.md           # User documentation
├── src/
│   ├── index.ts        # Main plugin class
│   └── notion-api.ts   # Notion API client
└── dist/
    ├── index.js        # Compiled output
    └── notion-api.js   # Compiled API
```

## Compilation

Both plugins are compiled to ES2020 + ESNext modules:

```bash
# GitHub
cd plugins/github && npm run build

# Notion
cd plugins/notion && npm run build
```

Output: JavaScript files in `dist/` ready for Web Worker execution.

## API Integration

### GitHub Plugin
- **API:** GitHub REST API v3
- **Base URL:** https://api.github.com
- **Authentication:** Optional (GITHUB_TOKEN env var)
- **Rate Limit:** 60 req/hour unauthenticated, 5000 authenticated

### Notion Plugin
- **API:** Notion API (v2024-02-15)
- **Base URL:** https://api.notion.com/v1
- **Authentication:** Required (NOTION_API_KEY env var)
- **Rate Limit:** 3 req/second (free), best effort (paid)

## User Configuration

### GitHub Plugin
Set environment variable:
```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
```

### Notion Plugin
Set environment variable:
```bash
export NOTION_API_KEY=secret_xxxxxxxxxxxxx
```

Or configure in Volt settings (future enhancement).

## Testing Checklist

- [x] Both plugins compile without errors
- [x] Manifest.json validation passes
- [x] TypeScript strict mode compliant
- [x] Network permissions declared
- [x] Web Worker compatible (prefix + keywords)
- [x] Error handling implemented
- [x] Documentation complete
- [x] Registry.json updated
- [x] Featured flag enabled

## Deployment

### Release Process

1. **Tag Release:**
   ```bash
   git tag github-v1.0.0
   git tag notion-v1.0.0
   ```

2. **Create Release:**
   - Create GitHub release with tag
   - Add release notes
   - Attach plugin ZIP archives

3. **Update Registry:**
   - Verify `downloadUrl` points to release
   - Update `lastUpdated` timestamp
   - Commit registry.json

### Distribution URLs

- **GitHub Plugin:** `https://github.com/VoltLaunchr/volt-extensions/releases/download/github-v1.0.0/github-v1.0.0.zip`
- **Notion Plugin:** `https://github.com/VoltLaunchr/volt-extensions/releases/download/notion-v1.0.0/notion-v1.0.0.zip`

## Future Enhancements

1. **Settings UI:** Allow API key configuration in Volt
2. **Rate Limit Display:** Show remaining API calls
3. **Offline Caching:** Cache recent searches
4. **Advanced Filters:** UI for complex GitHub/Notion queries
5. **Quick Actions:** Pin favorite repos/pages
6. **Keyboard Shortcuts:** Custom keybindings per extension

## Support

For issues or feature requests:
- GitHub Issues: https://github.com/VoltLaunchr/volt-extensions
- Documentation: See individual plugin READMEs

## License

Both plugins are distributed under MIT license.
