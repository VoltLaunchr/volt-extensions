# 🔐 Add Password Generator Extension

## Description

Cette PR ajoute une extension complète de génération de mots de passe cryptographiquement sécurisés pour Volt Launcher, implémentant les standards de sécurité NIST SP 800-63B et EFF Diceware.

## ✨ Nouvelles fonctionnalités

### Modes de génération

- **Mot de passe standard** : 12 caractères par défaut avec lettres, chiffres et symboles
- **Mot de passe fort** : 20 caractères avec tous les types de caractères
- **Mot de passe simple** : Sans symboles pour les systèmes qui les interdisent
- **Passphrase Diceware** : 6 mots de la liste officielle EFF (7776 mots)
- **Code PIN** : Numérique pur pour les authentifications rapides

### Commandes supportées

```
pass               # Mot de passe par défaut (12 chars)
pass 16            # Longueur personnalisée
pass strong        # Ultra sécurisé (20 chars)
pass simple        # Sans symboles spéciaux
pass phrase        # Passphrase Diceware (6 mots)
pass phrase 8      # Passphrase personnalisée (8 mots)
pass pin           # Code PIN (6 chiffres)
pass pin 8         # PIN personnalisé (8 chiffres)
```

## 🛡️ Standards de sécurité

- **NIST SP 800-63B** : Respect des recommandations officielles US
- **EFF Diceware** : Liste de 7776 mots validée cryptographiquement
- **Node.js crypto.randomInt()** : CSPRNG basé sur les APIs système (/dev/urandom, CryptGenRandom)
- **Calcul d'entropie** : Estimation précise de la robustesse

## 🏗️ Architecture technique

### Structure des fichiers

```
examples/password-generator/
├── index.ts                    # Plugin principal avec export par défaut
├── types.ts                    # Types TypeScript stricts
├── README.md                   # Documentation utilisateur
├── PLAN.md                     # Documentation technique
├── eff_large_wordlist.txt      # Liste EFF officielle (7776 mots)
├── components/
│   ├── PasswordView.tsx        # Composant React d'affichage
│   └── PasswordView.css        # Styles CSS modernes
├── parsers/
│   └── queryParser.ts          # Parser de commandes robuste
└── utils/
    ├── generator.ts            # Générateur cryptographique
    ├── strength.ts             # Calcul d'entropie et estimation
    └── wordlist.ts             # Chargeur de wordlist EFF
```

### Qualité du code

- ✅ **TypeScript strict** : Typage complet pour éviter les erreurs
- ✅ **Tests d'entropie** : Validation automatique de la force
- ✅ **Parser robuste** : Gestion d'erreurs et validation d'entrée
- ✅ **Interface React** : Composant réutilisable et accessible
- ✅ **Documentation complète** : README et commentaires détaillés

## 🔬 Sécurité cryptographique

### Génération aléatoire

- Utilise `crypto.randomInt()` de Node.js (CSPRNG)
- Pas de `Math.random()` (pseudo-aléatoire non sécurisé)
- Entropie maximale selon les standards NIST

### Calcul d'entropie

| Mode       | Formule                            | Exemple                |
| ---------- | ---------------------------------- | ---------------------- |
| Caractères | `longueur × log₂(taille_alphabet)` | 12 chars = 78.7 bits   |
| Diceware   | `nb_mots × log₂(7776)`             | 6 mots = 77.5 bits     |
| PIN        | `longueur × log₂(10)`              | 6 chiffres = 19.9 bits |

## 📦 Changements de fichiers

### Nouveaux fichiers

- `examples/password-generator/` : Extension complète
- `registry.json` : Ajout de l'extension au registre officiel

### Fichiers modifiés

- `api/typescript/src/types.ts` : Types pour les résultats de mots de passe

## 🧪 Tests manuels effectués

- ✅ Génération de mots de passe standards (diverses longueurs)
- ✅ Génération de mots de passe forts et simples
- ✅ Passphrases Diceware (6 et 8 mots)
- ✅ Codes PIN (6 et 8 chiffres)
- ✅ Calcul d'entropie pour tous les modes
- ✅ Interface React avec copie en un clic
- ✅ Validation des commandes et gestion d'erreurs

## 🎯 Impact utilisateur

Cette extension permet aux utilisateurs de Volt de :

1. **Générer rapidement** des mots de passe sécurisés
2. **Choisir le niveau** de sécurité approprié
3. **Utiliser des passphrases** mémorisables mais sécurisées
4. **Estimer la robustesse** avec le calcul d'entropie
5. **Copier facilement** les résultats

## 📋 Checklist

- [x] Code TypeScript avec types stricts
- [x] Standards de sécurité NIST et EFF respectés
- [x] Interface React fonctionnelle
- [x] Documentation complète (README + PLAN)
- [x] Extension ajoutée au registre
- [x] Tests manuels validés
- [x] Gestion d'erreurs robuste
