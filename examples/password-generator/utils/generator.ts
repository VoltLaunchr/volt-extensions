/**
 * Cryptographically Secure Password Generator
 *
 * Utilise crypto.randomInt() de Node.js (CSPRNG)
 * Conforme aux standards NIST SP 800-63B
 */

import { randomInt } from 'crypto';
import {
  PasswordOptions,
  PassphraseOptions,
  PinOptions,
  GeneratedPassword,
  PasswordMode,
  CHAR_SETS,
  MODE_CONFIGS,
} from '../types';
import { getWordByIndex, getWordlistSize, calculateDicewareEntropy } from './wordlist';
import { calculateStrength, calculateCharacterEntropy } from './strength';

/**
 * Génère un entier cryptographiquement sécurisé entre min (inclus) et max (exclus)
 * Utilise crypto.randomInt() qui est basé sur /dev/urandom (Linux) ou CryptGenRandom (Windows)
 */
function secureRandomInt(min: number, max: number): number {
  return randomInt(min, max);
}

/**
 * Génère un mot de passe avec des caractères aléatoires
 */
export function generatePassword(options: PasswordOptions): GeneratedPassword {
  const charset = buildCharset(options);

  if (charset.length === 0) {
    throw new Error('At least one character type must be enabled');
  }

  let password = '';
  for (let i = 0; i < options.length; i++) {
    const index = secureRandomInt(0, charset.length);
    password += charset[index];
  }

  // Garantir au moins un caractère de chaque type activé
  password = ensureCharacterTypes(password, options);

  const entropy = calculateCharacterEntropy(password.length, charset.length);
  const strength = calculateStrength(entropy);

  return {
    value: password,
    mode: detectMode(options),
    entropy,
    strength: strength.level,
    characterCount: password.length,
  };
}

/**
 * Génère une passphrase Diceware
 * Chaque mot = 12.925 bits d'entropie
 */
export function generatePassphrase(options: PassphraseOptions): GeneratedPassword {
  const wordlistSize = getWordlistSize();
  const words: string[] = [];

  for (let i = 0; i < options.wordCount; i++) {
    const index = secureRandomInt(0, wordlistSize);
    let word = getWordByIndex(index);

    if (options.capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }

    words.push(word);
  }

  const passphrase = words.join(options.separator);
  const entropy = calculateDicewareEntropy(options.wordCount);
  const strength = calculateStrength(entropy);

  return {
    value: passphrase,
    mode: 'phrase',
    entropy,
    strength: strength.level,
    characterCount: passphrase.length,
  };
}

/**
 * Génère un code PIN numérique
 */
export function generatePin(options: PinOptions): GeneratedPassword {
  let pin = '';
  const digits = CHAR_SETS.numbers;

  for (let i = 0; i < options.length; i++) {
    const index = secureRandomInt(0, digits.length);
    pin += digits[index];
  }

  const entropy = calculateCharacterEntropy(options.length, digits.length);
  const strength = calculateStrength(entropy);

  return {
    value: pin,
    mode: 'pin',
    entropy,
    strength: strength.level,
    characterCount: options.length,
  };
}

/**
 * Point d'entrée principal - génère selon le mode
 */
export function generate(
  mode: PasswordMode,
  length?: number,
  separator: string = '-'
): GeneratedPassword {
  const config = MODE_CONFIGS[mode];

  switch (mode) {
    case 'phrase':
      return generatePassphrase({
        wordCount: length ?? config.defaultLength,
        separator,
        capitalize: false,
      });

    case 'pin':
      return generatePin({
        length: length ?? config.defaultLength,
      });

    default:
      return generatePassword({
        length: length ?? config.defaultLength,
        includeUppercase: config.options.includeUppercase ?? true,
        includeLowercase: config.options.includeLowercase ?? true,
        includeNumbers: config.options.includeNumbers ?? true,
        includeSymbols: config.options.includeSymbols ?? false,
      });
  }
}

/**
 * Construit le charset selon les options
 */
function buildCharset(options: PasswordOptions): string {
  let charset = '';

  if (options.includeLowercase) charset += CHAR_SETS.lowercase;
  if (options.includeUppercase) charset += CHAR_SETS.uppercase;
  if (options.includeNumbers) charset += CHAR_SETS.numbers;
  if (options.includeSymbols) charset += CHAR_SETS.symbols;

  return charset;
}

/**
 * Garantit qu'au moins un caractère de chaque type activé est présent
 * Remplace des caractères aléatoires si nécessaire
 */
function ensureCharacterTypes(password: string, options: PasswordOptions): string {
  const chars = password.split('');
  const requirements: { check: RegExp; charset: string; enabled: boolean }[] = [
    { check: /[a-z]/, charset: CHAR_SETS.lowercase, enabled: options.includeLowercase },
    { check: /[A-Z]/, charset: CHAR_SETS.uppercase, enabled: options.includeUppercase },
    { check: /[0-9]/, charset: CHAR_SETS.numbers, enabled: options.includeNumbers },
    { check: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, charset: CHAR_SETS.symbols, enabled: options.includeSymbols },
  ];

  let position = 0;
  for (const req of requirements) {
    if (req.enabled && !req.check.test(password)) {
      // Insérer un caractère du type manquant à une position aléatoire
      const charIndex = secureRandomInt(0, req.charset.length);
      const insertPos = secureRandomInt(0, chars.length);
      chars[insertPos] = req.charset[charIndex];
    }
    position++;
  }

  return chars.join('');
}

/**
 * Détecte le mode basé sur les options
 */
function detectMode(options: PasswordOptions): PasswordMode {
  if (!options.includeSymbols && options.length === 12) return 'simple';
  if (options.length >= 20 && options.includeSymbols) return 'strong';
  return 'default';
}
