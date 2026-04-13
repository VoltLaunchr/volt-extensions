# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in a Volt extension, please report it responsibly:

1. **Do NOT open a public issue**
2. Email the maintainers or use [GitHub Security Advisories](https://github.com/VoltLaunchr/volt-extensions/security/advisories/new)
3. Include:
   - The affected extension name and version
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact

## Extension Security Model

Volt extensions run in a sandboxed Web Worker environment with the following constraints:

- **Permission-based**: Extensions must declare required permissions in their manifest
- **No direct filesystem access**: All file operations go through the Volt API
- **Network restrictions**: Network access requires explicit `network` permission
- **Clipboard**: Clipboard access requires `clipboard` permission
- **User consent**: Users are prompted to approve permissions before installation

## Review Process

All extensions submitted to this repository undergo a security review before being added to the registry. However, community extensions are provided as-is. Always review an extension's permissions before installing.
