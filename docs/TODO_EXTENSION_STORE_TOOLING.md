# Extension Store Tooling TODO

This document tracks the multi-pass work needed to bring `volt-extensions`
closer to a mature extension store workflow like Raycast, while staying aligned
with Volt's actual runtime and backend permission model.

## Current Context

- Volt runtime permissions are: `clipboard`, `network`, `notifications`,
  `openUrl`, `oauth`, `ai`, `system`.
- Sensitive runtime APIs are now backend-gated in Volt-public by extension
  existence, enabled state, and granted permissions.
- `volt-extensions` currently has a working CLI, schema, docs, examples, and
  public extensions, but the contribution guardrails are still thin compared
  with a large public extension store.
- Existing public extensions do not need new permissions for the backend hardening:
  `github` uses `network`/`openUrl`, `notion` uses `network`, and
  `password-generator` uses `clipboard`.

## Guiding Principles

- Treat the extension repo as a supply-chain boundary, not only a examples repo.
- Catch extension mistakes before install time: manifest, permissions, imports,
  secrets, packaging, and registry drift should fail locally and in CI.
- Prefer Volt-specific rules over copying Raycast conventions blindly.
- Keep the developer path simple: `volt-plugin init`, `volt-plugin lint`,
  `volt-plugin test`, `volt-plugin publish`.
- Keep Volt ESLint rules in the dedicated ESLint plugin/config package. This
  repo consumes that tooling through templates, CLI wrappers, and CI.

## Agent Audit Findings

### P0 - Store Gates That Must Exist Before Broad Contributions

- [x] Add initial GitHub Actions workflows under `.github/workflows/`.
  - Current `.github/` has templates only; docs say automated checks run on PRs.
  - Implemented jobs: CLI tests, CLI build, registry validation, TypeScript API
    build.
  - Remaining jobs: package dry-run, checksum validation, secret/package-content
    report, changed-extension targeting.
- [x] Add a dedicated `registry.schema.json` and registry validator.
  - `schemas/manifest.schema.json` validates extension manifests only.
  - `registry.json` also needs `downloadUrl`, dates, `verified`, `featured`,
    `screenshots`, `readmeUrl`, checksums, and source/package consistency.
- [x] Fail CI on registry/source drift.
  - Fixed local drift where `registry.json` listed `github` as `1.2.1`, while
    `extensions/github/manifest.json` listed `1.2.0`.
  - The validator should compare every registry manifest against the packaged
    source manifest or explicitly allow released-only entries.
- [x] Decide and enforce one canonical extension directory.
  - Public store entries now live under `extensions/`.
  - `examples/` is reserved for educational fixtures.
  - Validators still tolerate legacy `plugins/` paths during migration.
- [ ] Standardize artifact format.
  - CLI generates `{id}-v{version}.zip`.
  - Current registry has `.tar.gz` for GitHub/Notion and `.zip` for
    password-generator.
  - Pick one accepted archive format or teach validators to support both with
    explicit checks.

### P1 - CLI And Packaging Risks

- [x] Make schema loading fail closed.
  - `volt-plugin test` should fail if it cannot locate or parse the schema.
  - Do not silently skip JSON schema validation in packaged CLI installs.
- [ ] Harden package contents.
  - [x] Reject `.env`, private keys, credential files, and archives inside
    archives.
  - [ ] Reject or explicitly allow large binaries and build artifacts not listed
    in `files`.
  - [ ] Emit a machine-readable package manifest listing every included file.
- [ ] Add package checksums to registry entries.
  - [x] Store SHA-256 in generated registry entries when `volt-plugin publish`
    packages the archive.
  - [ ] Verify checksum in CI when the asset is available.
- [x] Make `publish` less manual.
  - Keep human review, but produce a machine-readable registry patch and
    package report instead of only printing JSON for copy/paste.
  - Implemented outputs: `submission.json`, `registry-patch.json`,
    `registry-entry.json`, `package-manifest.json`, `pull-request-body.md`, and
    the ZIP artifact under `.volt-publish/{id}-v{version}/`.
- [ ] Resolve npm namespace naming.
  - Existing packages use `@voltlaunchrr/*` with double `r`.
  - Proposed new packages use `@voltlaunchr/*`.
  - Decide whether to keep the historical namespace or migrate with a clear
    deprecation path.

### P2 - Developer Experience And Store Quality

- [ ] Require or grade metadata depending on extension tier.
  - Public featured extensions should require README, icon, screenshots, source
    repository, license, and useful category/keywords.
- [ ] Add `volt-plugin doctor`.
  - Check local Node/npm versions, schema availability, package namespace,
    manifest entrypoints, and common setup mistakes.
- [ ] Add `volt-plugin package --dry-run --json`.
  - This should be CI-friendly and show included files, excluded files,
    warnings, and computed checksum.

## Phase 0 - Stabilize The Current Contract

Status: in progress.

- [x] Align CLI permission allowlist with Volt runtime permissions.
- [x] Align JSON schema with current permissions and OAuth preference fields.
- [x] Add TypeScript API types for current `VoltAPI` surfaces.
- [x] Document backend-gated runtime APIs.
- [ ] Confirm whether `schemas/manifest.schema.json` should be tracked as a
  first-class source file if it was previously untracked locally.
- [ ] Decide whether category rename from `development` to `developer` is a
  breaking store migration or only a docs/tooling correction.
- [ ] Add a compatibility note for older manifests that used unsupported
  `filesystem` or `shell` permissions.
- [x] Decide whether `github` source manifest should be bumped to `1.2.1` or
  whether registry entries are allowed to point to released artifacts not
  matching current source.

Acceptance:

- `npm test` passes in `packages/cli/`.
- `npm run build` passes in `packages/cli/`.
- `npm run build` passes in `packages/api/typescript/`.
- A manifest using `oauth`, `ai`, `system`, `openUrl`, and OAuth preferences
  passes schema validation.

## Phase 1 - Add Volt ESLint Plugin MVP

Package target:

- separate ESLint plugin/config repository
- package name: `@voltlaunchr/eslint-plugin`
- config package, if useful: `@voltlaunchr/eslint-config`

MVP rules:

- [ ] `volt/no-tauri-api-import`
  - Forbid `@tauri-apps/api/*`, `__TAURI__`, and direct IPC access from
    extension code.
  - Rationale: extensions must go through `VoltAPI` and Worker bridge guards.
- [ ] `volt/require-manifest-permission`
  - Cross-check source usage against `manifest.json`.
  - `fetch` or authenticated service calls require `network`.
  - `VoltAPI.oauth.*` requires `oauth`.
  - `VoltAPI.ai.ask` requires `ai`.
  - `VoltAPI.system.*` requires `system`.
  - `VoltAPI.utils.copyToClipboard` / `pasteText` requires `clipboard`.
  - `VoltAPI.utils.openUrl` requires `openUrl`.
- [ ] `volt/no-secret-in-storage`
  - Flag likely tokens/API keys written to `VoltAPI.storage`, `localStorage`,
    `sessionStorage`, or plain JSON files.
  - Recommend `VoltAPI.secrets` or manifest `secret` preference.
- [ ] `volt/confirm-destructive-system-action`
  - Warn when `VoltAPI.system.moveToTrash` is called without a nearby
    `VoltAPI.confirm`.
- [ ] `volt/no-unsafe-open-url`
  - Warn on `openUrl` with unvalidated user-controlled strings.
  - Keep this conservative to avoid noisy false positives.
- [ ] `volt/valid-extension-manifest`
  - Validate `manifest.json` against schema and semantic rules that require
    filesystem context.
  - Check `main` and `commands[].main` exist.
  - Check `files` includes every runtime entrypoint when `files` is present.
  - Check OAuth preferences include provider, auth URL, token URL, and client ID.
  - Check permissions are unique and in the current allowlist.

Files to analyze:

- `manifest.json` is required.
- Source entrypoints from `manifest.main` and each `commands[].main`.
- Local import graph from entrypoints: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`,
  `.cjs`.
- Ignore `dist/`, archives, `node_modules`, assets, screenshots, and wordlists.

Rule test fixtures:

- [ ] Valid extension with required permissions.
- [ ] Valid manifest with `commands[].main`.
- [ ] Invalid manifest with permission unknown.
- [ ] Invalid manifest with `files` omitting an entrypoint.
- [ ] Missing `network` for `fetch`.
- [ ] Missing `oauth` for `VoltAPI.oauth.authorize`.
- [ ] Missing `ai` for `VoltAPI.ai.ask`.
- [ ] Missing `system` for `getApplications`, `showInFolder`, `moveToTrash`.
- [ ] Missing `clipboard` for clipboard helpers.
- [ ] Direct Tauri import.
- [ ] Secret-like value written to storage.
- [ ] `moveToTrash` without `VoltAPI.confirm` warns.
- [ ] `openUrl(context.query)` warns; validated URL passes.
- [ ] Real fixture calibration against `extensions/github`,
  `extensions/notion`, and `extensions/password-generator`.

False-positive guardrails:

- Do not require `network` for relative `fetch("./asset.json")` or
  `fetch("/local.txt")`.
- Do not treat all in-memory caches as persisted secret storage.
- Do not require `openUrl` just because `data.url` exists; require it when the
  extension actually opens the URL or declares an `openUrl` action.
- Treat legacy patterns such as `window.open`, `process.env`, and
  `VoltAPI.saveCredential` as migration warnings first if they appear in
  existing extensions.

Acceptance:

- ESLint plugin builds with TypeScript.
- Rule tests cover at least one valid and one invalid case per MVP rule.
- A sample extension can run `eslint .` and receive Volt-specific diagnostics.

## Phase 2 - Wire Lint Into CLI And Template

- [x] Add `volt-plugin lint`.
  - Implemented as an ESLint wrapper so the dedicated ESLint plugin/config repo
    owns Volt-specific rules.
- [x] Make `volt-plugin test` run:
  - manifest semantic validation
  - JSON schema validation
  - ESLint
  - TypeScript check
  - package dry-run
- [x] Update TypeScript template:
  - `eslint.config.js`
  - `.prettierrc`
  - scripts: `lint`, `test`, `build`
  - dependencies for ESLint and Prettier
- [x] Ensure CLI can validate an extension by directory via `--dir`.
- [ ] Document how to suppress a rule with justification.

Acceptance:

- Fresh `volt-plugin init` project can run `npm run lint`, `npm run build`, and
  `volt-plugin test`.
- Existing examples and official extensions pass or have documented,
  intentional warnings.

## Phase 3 - Store Repository Hardening

- [x] Decide final repo layout:
  - Public store extensions live in `extensions/`.
  - Tooling packages live in `packages/api` and `packages/cli`.
  - `packages/eslint-plugin` remains future work because the ESLint plugin is
    tracked as a separate package/repository decision.
- [x] Add changed-extension CI:
  - detect changed extension folders
  - validate manifests
  - run lint/build/test per changed extension
  - verify registry entry matches source manifest via registry validator
- [ ] Verify registry entry matches the packaged manifest inside the release
  archive.
- [ ] Add package integrity:
  - [x] registry checksum for release archive in generated publish artifacts
  - [x] package dry-run manifest/file list output via `package-manifest.json`
  - reject `.env`, private keys, credentials, `node_modules`, large binaries
- [ ] Add metadata validation:
  - icon present and reasonable size/type
  - screenshots path/URL valid
  - README exists
  - repository/homepage URLs valid
- [ ] Add `minVoltVersion` compatibility rules for features:
  - `oauth`, `ai`, `system`, background refresh
  - future runtime APIs

Acceptance:

- Pull requests that add/update extensions fail on missing metadata, invalid
  permissions, unsafe package contents, or registry/package drift.
- Maintainers get a short machine-readable report of changed extensions.

## Phase 4 - Developer Experience

- [x] Create a "Prepare Extension For Store" doc.
- [ ] Add examples for:
  - OAuth extension
  - AI extension
  - System extension with confirmation before destructive action
  - Storage + secrets best practices
- [ ] Add `volt-plugin doctor`.
- [ ] Add `volt-plugin package --dry-run --json`.
- [ ] Add local dev watch flow that runs lint/test on change.

Acceptance:

- A third-party developer can scaffold, lint, test, package, and submit an
  extension without reading Volt-public internals.

## Open Decisions

- Should the ESLint plugin live in this repo or in a separate repo?
  - Decision: separate repo/package. `volt-extensions` consumes it through
    `eslint.config.js`, CLI wrappers, and CI.
- Should `filesystem` and `shell` ever return as permissions?
  - Default: no, not until Volt has a dedicated runtime API and backend guard.
- Should dev extensions get persisted backend grants?
  - Default: later. Current backend permissioned commands fail closed for dev
    extensions because grants are not persisted.
- Should the registry support checksums before the next public release?
  - Recommended: yes before accepting broad third-party submissions.

## Validation Commands

Run from `D:\dev\_ecosystems\volt\volt-extensions`:

```powershell
node -e "JSON.parse(require('fs').readFileSync('schemas/manifest.schema.json','utf8')); console.log('schema ok')"
```

Run from `D:\dev\_ecosystems\volt\volt-extensions\packages\cli`:

```powershell
npm test
npm run build
```

Run from `D:\dev\_ecosystems\volt\volt-extensions\packages\api\typescript`:

```powershell
npm run build
```
