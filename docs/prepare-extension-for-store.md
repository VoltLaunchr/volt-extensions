# Prepare Extension For Store

Use this checklist before opening a pull request to the Volt extension store.

## Naming

- Use a short, unique, kebab-case `id`: `github`, `password-generator`, `linear-search`.
- Use a readable `name`: `GitHub`, `Password Generator`, `Linear Search`.
- Keep `description` factual and specific. Avoid marketing claims that are not visible in the extension.
- Pick a `prefix` only when the extension has a natural command namespace.

Good:

```json
{
  "id": "password-generator",
  "name": "Password Generator",
  "description": "Generate cryptographically secure passwords using Diceware wordlists",
  "prefix": "pass"
}
```

Bad:

```json
{
  "id": "Password Generator!",
  "name": "The Best Security Tool Ever",
  "description": "The ultimate password manager for everyone"
}
```

## Icons, Screenshots, And README

- Include an icon when the extension has a public store entry.
- Use PNG, JPG, JPEG, WebP, or GIF screenshots.
- Put store screenshots and long descriptions under `metadata/`.
- Keep `README.md` focused on what the extension does, how to trigger it, and what permissions it needs.
- Do not include private screenshots, credentials, tokens, local paths, or customer data.

## Permissions

Declare only the permissions that the extension actually uses.

| Permission      | Required when                                                   |
| --------------- | --------------------------------------------------------------- |
| `clipboard`     | Reading or writing clipboard content                            |
| `network`       | Calling external HTTP APIs                                      |
| `notifications` | Showing system notifications                                    |
| `openUrl`       | Opening URLs in the default browser                             |
| `oauth`         | Starting OAuth or reading extension OAuth tokens                |
| `ai`            | Calling Volt AI helpers                                         |
| `system`        | Listing applications, revealing files, or moving files to Trash |

Good:

```json
{
  "permissions": ["network", "openUrl"]
}
```

Bad:

```json
{
  "permissions": ["network", "openUrl", "oauth", "ai", "system"]
}
```

## OAuth

- Use `oauth` only when the extension starts OAuth or reads OAuth tokens.
- Do not return raw tokens in UI-facing commands.
- Prefer provider-specific scopes that are read-only unless write access is required.
- Document why each requested scope is needed in `README.md`.

## AI

- Use `ai` only for calls routed through Volt's AI runtime.
- Be explicit about what data is sent to the model.
- Avoid sending secrets, access tokens, private paths, or full file contents unless the user explicitly asked for that workflow.

## System Permission

The `system` permission covers APIs with OS impact:

- `getApplications`
- `showInFolder`
- `moveToTrash`

Use confirmation before destructive actions such as moving files to Trash. Keep system actions narrow and predictable.

## Package Contents

Before publishing, run:

```bash
volt-plugin test
```

The package dry-run rejects:

- `.env`
- `.npmrc`
- `.netrc`
- private key files
- certificate/key archives such as `.pem`, `.key`, `.p12`, `.pfx`
- nested archives such as `.zip`, `.tar.gz`, `.tgz`, `.7z`, `.rar`

Do not include:

- `node_modules/`
- local build caches
- unrelated lockfiles
- private screenshots
- generated packages from previous releases

## Manifest Examples

Minimal extension:

```json
{
  "id": "websearch",
  "name": "Web Search",
  "version": "1.0.0",
  "description": "Search Google, Bing, or DuckDuckGo directly from Volt",
  "author": { "name": "VoltLaunchr Community", "github": "VoltLaunchr" },
  "main": "index.ts",
  "category": "utilities",
  "keywords": ["web", "search"],
  "prefix": "?",
  "minVoltVersion": "0.4.0",
  "permissions": [],
  "files": ["index.ts"]
}
```

Network extension:

```json
{
  "id": "github",
  "name": "GitHub",
  "version": "1.2.1",
  "description": "Search GitHub repositories, issues, pull requests, and gists",
  "author": { "name": "VoltLaunchr Community", "github": "VoltLaunchr" },
  "main": "src/index.ts",
  "category": "productivity",
  "keywords": ["github", "repositories", "issues", "pull-requests"],
  "prefix": "gh",
  "permissions": ["network", "openUrl"],
  "minVoltVersion": "0.4.0"
}
```

## Review Checklist

- `volt-plugin lint` passes.
- `volt-plugin test` passes.
- `npm run build` passes if the extension has a TypeScript build.
- Manifest passes semantic validation and JSON schema validation.
- Permissions match real code usage.
- `minVoltVersion` is present and compatible with used APIs.
- Icon, screenshots, and README are present for public store submissions.
- `registry.json` matches the packaged manifest.
- Release archive checksum is present once checksum enforcement is enabled.
