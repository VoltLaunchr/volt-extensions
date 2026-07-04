# Password Generator Extension

Volt extension for generating cryptographically secure passwords following NIST SP 800-63B and EFF Diceware standards.

## Features

- Secure password generation using `crypto.randomInt()` (CSPRNG)
- EFF Diceware passphrases with the official 7776-word list (12.925 bits/word)
- Real-time entropy calculation and strength estimation
- One-click copy to clipboard

## Commands

| Command | Description | Example Output |
|---------|-------------|----------------|
| `pass` | Default password (12 chars) | `aB3$kL9mNp2x` |
| `pass 16` | Custom length | `aB3$kL9mNp2xYz7!` |
| `pass strong` | High security (20 chars) | `#aB3$kL9@mNp2x!Yz7&` |
| `pass simple` | No symbols | `aB3kL9mNp2xY` |
| `pass phrase` | Diceware passphrase (6 words) | `correct-horse-battery-staple` |
| `pass phrase 8` | 8-word passphrase | `word1-word2-word3-...` |
| `pass pin` | PIN code (6 digits) | `847291` |
| `pass pin 8` | Custom PIN length | `84729163` |

## Security Standards

- **NIST SP 800-63B** — US authentication guidelines
- **EFF Diceware** — Cryptographically validated wordlist for passphrases
- **CSPRNG** — Uses Node.js `crypto.randomInt()`, not `Math.random()`

## Entropy Calculation

| Mode | Formula | Example |
|------|---------|---------|
| Characters | `length * log2(charsetSize)` | 12 chars, 94 charset = 78.7 bits |
| Diceware | `wordCount * log2(7776)` | 6 words = 77.5 bits |
| PIN | `length * log2(10)` | 6 digits = 19.9 bits |

## Architecture

```
password-generator/
├── index.ts              Main plugin class
├── types.ts              Type definitions
├── manifest.json         Extension manifest
├── parsers/
│   └── queryParser.ts    Command detection and parsing
├── utils/
│   ├── generator.ts      Cryptographic password generation
│   ├── strength.ts       Entropy calculation and strength rating
│   └── wordlist.ts       EFF wordlist loader with fallback
└── components/
    ├── PasswordView.tsx   React UI component
    └── PasswordView.css   Styles
```
