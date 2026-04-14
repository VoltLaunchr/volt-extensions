# Publishing Your Extension

Share your plugin with the Volt community.

## Prerequisites

- Working plugin tested locally (see [Dev Workflow](dev-workflow.md))
- GitHub account
- README.md for your plugin

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

```bash
git checkout -b add-your-plugin-name
git add .
git commit -m "Add YourPluginName extension"
git push origin add-your-plugin-name
```

Then create a Pull Request on GitHub.

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

## Creating a Release

Once your extension is ready, create a GitHub release with the packaged extension.

### 1. Package your extension

Using the CLI tool:

```bash
cd your-extension
volt-plugin publish
```

Or manually create a `.zip` file containing your extension files (manifest.json, plugin files, assets).

### 2. Create a GitHub release

- Go to your repository's Releases page
- Click "Create a new release"
- Create a tag following the format: `{extension-id}-v{version}` (e.g., `password-generator-v1.0.0`)
- Upload your `.zip` file as a release asset

### 3. Update registry.json

Add your extension to `registry.json` with the correct `downloadUrl` pointing to your release:

```json
{
  "manifest": {
    "id": "your-extension-id",
    "name": "Your Extension",
    "version": "1.0.0"
  },
  "downloadUrl": "https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}.zip"
}
```

Example URL:

```
https://github.com/VoltLaunchr/volt-extensions/releases/download/password-generator-v1.0.4/password-generator-v1.0.4.zip
```

The `downloadUrl` must point to a valid GitHub release asset. Volt uses this URL to download and install extensions.

## Review Process

1. Automated checks run on the PR
2. Maintainer reviews code and security
3. Feedback provided if needed
4. Merged and published to the extension store

## Need Help?

- [Open an issue](https://github.com/VoltLaunchr/volt-extensions/issues)
- [Discussions](https://github.com/VoltLaunchr/volt-extensions/discussions)
