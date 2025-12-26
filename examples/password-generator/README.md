# Password Generator Extension

Extension Volt pour générer des mots de passe cryptographiquement sécurisés selon les standards NIST SP 800-63B et EFF Diceware.

## Fonctionnalités

- **Mots de passe sécurisés** : Générés avec Node.js `crypto.randomInt()` (CSPRNG)
- **Passphrases Diceware** : Liste officielle EFF de 7776 mots (12.925 bits/mot)
- **Calcul d'entropie** : Estimation précise de la force du mot de passe
- **Interface intuitive** : Composant React avec copie en un clic

## Commandes supportées

| Commande        | Description                        | Exemple                                           |
| --------------- | ---------------------------------- | ------------------------------------------------- |
| `pass`          | Mot de passe par défaut (12 chars) | `aB3$kL9mNp2x`                                    |
| `pass 16`       | Longueur personnalisée             | `aB3$kL9mNp2xYz7!`                                |
| `pass strong`   | Ultra sécurisé (20 chars)          | `#aB3$kL9@mNp2x!Yz7&`                             |
| `pass simple`   | Sans symboles                      | `aB3kL9mNp2xY`                                    |
| `pass phrase`   | Passphrase Diceware (6 mots)       | `correct-horse-battery-staple`                    |
| `pass phrase 8` | Passphrase 8 mots                  | `word1-word2-word3-word4-word5-word6-word7-word8` |
| `pass pin`      | Code PIN (6 chiffres)              | `847291`                                          |
| `pass pin 8`    | PIN personnalisé                   | `84729163`                                        |

## Standards de sécurité

- **NIST SP 800-63B** : Recommandations officielles pour l'authentification
- **EFF Diceware** : Liste de mots validée pour les passphrases sécurisées
- **CSPRNG** : Générateur cryptographiquement sécurisé (Node.js crypto)

## Calcul d'entropie

| Mode       | Formule                      | Exemple                          |
| ---------- | ---------------------------- | -------------------------------- |
| Caractères | `length × log₂(charsetSize)` | 12 chars, 94 charset = 78.7 bits |
| Diceware   | `wordCount × log₂(7776)`     | 6 mots = 77.5 bits               |
| PIN        | `length × log₂(10)`          | 6 chiffres = 19.9 bits           |

## Structure technique

- **TypeScript** : Types stricts pour la sécurité
- **React** : Interface utilisateur moderne
- **Parser robuste** : Analyse des commandes avec validation
- **Tests de force** : Évaluation automatique des mots de passe
