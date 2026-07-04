/**
 * Password Query Parser
 *
 * Parse les commandes utilisateur:
 * - pass          → mot de passe par défaut (12 chars)
 * - pass 16       → longueur personnalisée
 * - pass strong   → ultra sécurisé (20 chars)
 * - pass simple   → sans symboles
 * - pass phrase   → passphrase Diceware (6 mots)
 * - pass phrase 8 → passphrase avec 8 mots
 * - pass pin      → code PIN (6 chiffres)
 * - pass pin 8    → PIN de 8 chiffres
 */

import { ParsedPasswordQuery, PasswordMode } from '../types';

// Patterns de détection
const PASS_TRIGGER = /^pass(?:word)?(?:\s|$)/i;
const MODE_KEYWORDS: Record<string, PasswordMode> = {
  strong: 'strong',
  fort: 'strong',
  secure: 'strong',
  simple: 'simple',
  easy: 'simple',
  facile: 'simple',
  phrase: 'phrase',
  passphrase: 'phrase',
  diceware: 'phrase',
  pin: 'pin',
  code: 'pin',
};

/**
 * Vérifie si la requête est une commande de mot de passe
 */
export function isPasswordQuery(query: string): boolean {
  return PASS_TRIGGER.test(query.trim());
}

/**
 * Parse une requête de mot de passe
 */
export function parsePasswordQuery(query: string): ParsedPasswordQuery | null {
  const trimmed = query.trim().toLowerCase();

  if (!isPasswordQuery(trimmed)) {
    return null;
  }

  // Extraire les tokens après "pass" ou "password"
  const tokens = trimmed
    .replace(PASS_TRIGGER, '')
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0);

  // Valeurs par défaut
  let mode: PasswordMode = 'default';
  let length: number | undefined;
  let wordCount: number | undefined;
  let separator = '-';

  for (const token of tokens) {
    // Vérifier si c'est un mot-clé de mode
    if (MODE_KEYWORDS[token]) {
      mode = MODE_KEYWORDS[token];
      continue;
    }

    // Vérifier si c'est un nombre (longueur ou nombre de mots)
    const num = parseInt(token, 10);
    if (!isNaN(num) && num > 0) {
      if (mode === 'phrase') {
        wordCount = Math.min(Math.max(num, 3), 12); // 3-12 mots
      } else if (mode === 'pin') {
        length = Math.min(Math.max(num, 4), 12); // 4-12 chiffres
      } else {
        length = Math.min(Math.max(num, 4), 128); // 4-128 caractères
      }
      continue;
    }

    // Vérifier si c'est un séparateur pour passphrase (1-2 caractères)
    if (token.length <= 2 && mode === 'phrase') {
      separator = token;
    }
  }

  return {
    mode,
    length,
    wordCount,
    separator,
  };
}

/**
 * Génère une description de la commande parsée
 */
export function describeQuery(parsed: ParsedPasswordQuery): string {
  switch (parsed.mode) {
    case 'strong':
      return `Mot de passe fort (${parsed.length ?? 20} caractères)`;
    case 'simple':
      return `Mot de passe simple (${parsed.length ?? 12} caractères, sans symboles)`;
    case 'phrase':
      return `Passphrase Diceware (${parsed.wordCount ?? 6} mots)`;
    case 'pin':
      return `Code PIN (${parsed.length ?? 6} chiffres)`;
    default:
      return `Mot de passe (${parsed.length ?? 12} caractères)`;
  }
}
