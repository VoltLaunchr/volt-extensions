# Password Generator Extension

Extension Volt pour generer des mots de passe cryptographiquement securises.

## Standards de securite

- **NIST SP 800-63B** : Recommandations officielles pour les mots de passe
- **EFF Diceware** : Liste de 7776 mots pour passphrases (12.925 bits/mot)
- **Node.js crypto.randomInt()** : CSPRNG base sur /dev/urandom (Linux) ou CryptGenRandom (Windows)

## Commandes

| Commande | Description | Exemple |
|----------|-------------|---------|
| `pass` | Mot de passe par defaut (12 chars) | `aB3$kL9mNp2x` |
| `pass 16` | Longueur personnalisee | `aB3$kL9mNp2xYz7!` |
| `pass strong` | Ultra securise (20 chars) | `#aB3$kL9@mNp2x!Yz7&` |
| `pass simple` | Sans symboles | `aB3kL9mNp2xY` |
| `pass phrase` | Passphrase Diceware (6 mots) | `correct-horse-battery-staple` |
| `pass phrase 8` | Passphrase 8 mots | `word-word-word-word-word-word-word-word` |
| `pass pin` | Code PIN (6 chiffres) | `847291` |
| `pass pin 8` | PIN personnalise | `84729163` |

## Structure du projet

```
password-generator/
├── index.ts                    # Plugin principal
├── types.ts                    # Types TypeScript
├── eff_large_wordlist.txt      # Liste EFF (7776 mots)
├── PLAN.md                     # Documentation
├── components/
│   ├── PasswordView.tsx        # Composant React
│   └── PasswordView.css        # Styles
├── parsers/
│   └── queryParser.ts          # Parser des commandes
└── utils/
    ├── generator.ts            # Generation cryptographique
    ├── strength.ts             # Calcul d'entropie
    └── wordlist.ts             # Chargement EFF wordlist
```

## Calcul d'entropie

| Mode | Formule | Exemple |
|------|---------|---------|
| Caracteres | `length * log2(charsetSize)` | 12 chars, 94 charset = 78.7 bits |
| Diceware | `wordCount * log2(7776)` | 6 mots = 77.5 bits |
| PIN | `length * log2(10)` | 6 chiffres = 19.9 bits |

## Niveaux de force

| Niveau | Entropie | Temps de crack (10B/s) |
|--------|----------|------------------------|
| Faible | < 28 bits | < 1 seconde |
| Passable | 28-35 bits | Secondes a minutes |
| Bon | 36-59 bits | Heures a jours |
| Fort | 60-77 bits | Annees |
| Excellent | 78+ bits | Millions d'annees |

## Fichiers implementes

### types.ts
- `PasswordMode`: 'default' | 'strong' | 'simple' | 'phrase' | 'pin'
- `PasswordOptions`: Configuration de generation
- `GeneratedPassword`: Resultat avec entropie et force
- `CHAR_SETS`: Alphabets disponibles
- `MODE_CONFIGS`: Configuration par mode

### utils/generator.ts
- `generate()`: Point d'entree principal
- `generatePassword()`: Mots de passe caracteres
- `generatePassphrase()`: Passphrases Diceware
- `generatePin()`: Codes PIN

### utils/strength.ts
- `calculateCharacterEntropy()`: Entropie caracteres
- `calculateStrength()`: Niveau de force
- `estimateCrackTime()`: Estimation temps de crack

### utils/wordlist.ts
- `loadWordlist()`: Charge la liste EFF
- `getWordByIndex()`: Recupere un mot par index
- `calculateDicewareEntropy()`: Entropie Diceware

### parsers/queryParser.ts
- `isPasswordQuery()`: Detection commande pass
- `parsePasswordQuery()`: Extraction mode et options

### components/PasswordView.tsx
- Interface React complete
- Indicateur de force visuel
- Boutons de mode rapide
- Copie dans le presse-papier

## Securite

### Garanties
- Aucun usage de `Math.random()` (PRNG faible)
- Utilisation exclusive de `crypto.randomInt()` (CSPRNG)
- Liste EFF validee par la communaute crypto
- Entropie minimale recommandee : 77 bits (6 mots Diceware)

### Resistance aux attaques
- **Brute force** : 2^77 operations pour passphrase 6 mots
- **Dictionnaire** : Liste EFF concue contre ces attaques
- **Rainbow tables** : Espace trop vaste (7776^6 combinaisons)

## Ressources

- [EFF Wordlist](https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt)
- [NIST 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Diceware specification](https://theworld.com/~reinhold/diceware.html)
