/**
 * Password Generator Plugin - Types
 * Standards: NIST SP 800-63B, EFF Diceware
 */

// ============================================================================
// Password Modes
// ============================================================================

export type PasswordMode = 'default' | 'strong' | 'simple' | 'phrase' | 'pin';

// ============================================================================
// Character Sets
// ============================================================================

export interface CharacterSets {
  lowercase: string;
  uppercase: string;
  numbers: string;
  symbols: string;
}

export const CHAR_SETS: CharacterSets = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

// ============================================================================
// Password Options
// ============================================================================

export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalize: boolean;
}

export interface PinOptions {
  length: number;
}

// ============================================================================
// Generation Results
// ============================================================================

export interface GeneratedPassword {
  value: string;
  mode: PasswordMode;
  entropy: number;
  strength: PasswordStrength;
  characterCount: number;
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'excellent';

export interface StrengthInfo {
  level: PasswordStrength;
  score: number; // 0-100
  label: string;
  color: string;
}

// ============================================================================
// Query Parsing
// ============================================================================

export interface ParsedPasswordQuery {
  mode: PasswordMode;
  length?: number;
  wordCount?: number;
  separator?: string;
}

// ============================================================================
// Mode Configurations
// ============================================================================

export interface ModeConfig {
  mode: PasswordMode;
  defaultLength: number;
  options: Partial<PasswordOptions>;
  description: string;
}

export const MODE_CONFIGS: Record<PasswordMode, ModeConfig> = {
  default: {
    mode: 'default',
    defaultLength: 12,
    options: {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    },
    description: 'Balanced security with all character types',
  },
  strong: {
    mode: 'strong',
    defaultLength: 20,
    options: {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    },
    description: 'Maximum security for sensitive accounts',
  },
  simple: {
    mode: 'simple',
    defaultLength: 12,
    options: {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
    },
    description: 'Easy to type, no special characters',
  },
  phrase: {
    mode: 'phrase',
    defaultLength: 6, // word count
    options: {},
    description: 'Memorable passphrase using EFF Diceware',
  },
  pin: {
    mode: 'pin',
    defaultLength: 6,
    options: {
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
    },
    description: 'Numeric PIN code',
  },
};

// ============================================================================
// Entropy Constants
// ============================================================================

export const ENTROPY_THRESHOLDS = {
  weak: 28,      // < 28 bits
  fair: 35,      // 28-35 bits
  good: 59,      // 36-59 bits
  strong: 77,    // 60-77 bits
  excellent: 128 // 78+ bits
} as const;

// EFF Large Wordlist: 7776 words = log2(7776) = 12.925 bits per word
export const BITS_PER_DICEWARE_WORD = 12.925;
