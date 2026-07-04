# Contributing to Volt Extensions

Thank you for your interest in contributing to the Volt Extensions ecosystem!

## How to Contribute

### Submitting a New Extension

1. Fork this repository
2. Create a new branch: `git checkout -b my-extension`
3. Add your extension in `extensions/your-extension-name/`
4. Follow the structure in `templates/` for guidance
5. Update `registry.json` with your extension metadata
6. Submit a Pull Request

### Extension Requirements

- Must include a valid `manifest.json` with id, name, version, and permissions
- Must export a default plugin object compatible with the Volt Plugin API
- TypeScript is strongly recommended (will be transpiled via Sucrase)
- Include a `README.md` describing usage and commands
- No malicious code or data exfiltration

### Reporting Bugs

- Use the Bug Report issue template
- Include the extension name, version, and steps to reproduce

### Suggesting Features

- Use the Feature Request issue template
- Explain the use case and expected behavior

## Code Style

- TypeScript with strict types
- Use the Volt Plugin API (`VoltAPI`) for system interactions
- No direct filesystem or network access without declared permissions
- Follow existing extension patterns in `extensions/` and the smaller educational samples in `examples/`

## Review Process

1. PRs are reviewed for security, code quality, and API compliance
2. Extensions must not request unnecessary permissions
3. All community extensions go through a basic security review

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
