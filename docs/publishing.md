# Publishing Your Extension

Share your plugin with the Volt community!

## Prerequisites

- Working plugin tested locally
- GitHub account
- README.md for your plugin

## Submission Process

### 1. Fork this repo

```bash
# Fork on GitHub, then:
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
- Author/license info

### 4. Submit a PR

```bash
git checkout -b add-your-plugin-name
git add .
git commit -m "Add YourPluginName extension"
git push origin add-your-plugin-name
```

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
