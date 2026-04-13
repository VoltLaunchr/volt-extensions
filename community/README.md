# Community Extensions

Welcome to the Volt extensions community!

## Available Extensions

| Extension | Version | Category | Description |
|-----------|---------|----------|-------------|
| [Password Generator](../examples/password-generator/) | 1.0.4 | Utilities | Cryptographically secure passwords (NIST/EFF standards) |

Browse all extensions in the [registry](../registry.json) or via the Volt extension store (Settings > Extensions).

## Submit Your Extension

Want to publish your own extension? See the [Publishing Guide](../docs/publishing.md) for the full process:

1. Fork this repository
2. Add your extension to `community/`
3. Create a `manifest.json` and `README.md`
4. Package with `node scripts/package-extension.js`
5. Submit a Pull Request

## Guidelines

- Test your extension thoroughly before submitting
- Include clear documentation with usage examples
- Follow the existing code style (TypeScript, strict mode)
- Handle errors gracefully (never throw from `match()`)
- Keep dependencies minimal
- Be respectful and constructive in discussions

## Support

Need help building an extension? Check these resources:

- [Getting Started Guide](../docs/getting-started.md)
- [Plugin API Reference](../docs/plugin-api.md)
- [Dev Workflow](../docs/dev-workflow.md)
- [Open an issue](https://github.com/VoltLaunchr/volt-extensions/issues)
