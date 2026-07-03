# Publishing Your Extension

Share your plugin with the Volt community.

## Prerequisites

- Working plugin tested locally (see [Dev Workflow](dev-workflow.md))
- GitHub account
- README.md for your plugin
- Completed [Prepare Extension For Store](prepare-extension-for-store.md) checklist

## Submission Process

### 1. Fork this repo

```bash
git clone https://github.com/YOUR_USERNAME/volt-extensions.git
```

### 2. Add your plugin

```bash
cd volt-extensions/community
mkdir your-plugin-name
cd your-plugin-name
# Add your plugin files
```

### 3. Create a README

Include:

- Plugin name and description
- Installation instructions
- Usage examples
- Screenshots (if applicable)
- Author and license info

### 4. Submit a PR

Before opening the PR:

```bash
volt-plugin lint
volt-plugin test
volt-plugin publish
```

```bash
git checkout -b add-your-plugin-name
git add .
git commit -m "Add YourPluginName extension"
git push origin add-your-plugin-name
```

Then create a Pull Request on GitHub.

Use `.volt-publish/{id}-v{version}/pull-request-body.md` as the PR body
starter, and attach or paste `.volt-publish/{id}-v{version}/submission.json`
when maintainers ask for the machine-readable submission payload.

## Guidelines

**Do:**

- Test your plugin thoroughly before submitting
- Include clear documentation with usage examples
- Follow the existing code style (TypeScript strict mode)
- Add error handling — never throw from `match()`
- Keep dependencies minimal

**Don't:**

- Submit malicious code or data exfiltration
- Include API keys, secrets, or credentials
- Use excessive system resources
- Violate third-party Terms of Service

## Store Submission Artifacts

`volt-plugin publish` creates a review packet locally. It does not publish the
extension directly and does not require contributors to create GitHub releases.

### 1. Generate the submission

Using the CLI tool:

```bash
cd your-extension
volt-plugin publish
```

Generated files:

```text
.volt-publish/{id}-v{version}/
├── artifacts/{id}-v{version}.zip
├── package-manifest.json
├── pull-request-body.md
├── registry-entry.json
├── registry-patch.json
└── submission.json
```

### 2. What reviewers check

- `package-manifest.json` lists every packaged file and the archive SHA-256.
- `registry-patch.json` is the proposed registry upsert.
- `submission.json` combines source path, package data, registry patch, and PR
  review checklist.
- `pull-request-body.md` gives contributors a PR description template.

### 3. Release ownership

Maintainers publish release assets after review and merge. Registry entries must
continue to point to Volt-owned release assets under:

```text
https://github.com/VoltLaunchr/volt-extensions/releases/download/{id}-v{version}/{id}-v{version}.zip
```

## Review Process

1. Automated checks run on the PR
2. Maintainer reviews code, metadata, permissions, package manifest, and checksum
3. Feedback provided if needed
4. Merged to the store source branch
5. Release workflow publishes the archive and updates the extension store

## Need Help?

- [Open an issue](https://github.com/VoltLaunchr/volt-extensions/issues)
- [Discussions](https://github.com/VoltLaunchr/volt-extensions/discussions)
