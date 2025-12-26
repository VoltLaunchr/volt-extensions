/**
 * Password Strength Calculator
 *
 * Calcule l'entropie et la force des mots de passe
 * Basé sur les recommandations NIST SP 800-63B
 */

import { PasswordStrength, StrengthInfo, ENTROPY_THRESHOLDS } from '../types';

/**
 * Calcule l'entropie pour un mot de passe basé sur des caractères
 * Formule: bits = length * log2(charsetSize)
 */
export function calculateCharacterEntropy(length: number, charsetSize: number): number {
  if (length <= 0 || charsetSize <= 0) return 0;
  return length * Math.log2(charsetSize);
}

/**
 * Détermine le niveau de force basé sur l'entropie
 */
export function calculateStrength(entropy: number): StrengthInfo {
  if (entropy < ENTROPY_THRESHOLDS.weak) {
    return {
      level: 'weak',
      score: Math.round((entropy / ENTROPY_THRESHOLDS.weak) * 20),
      label: 'Faible',
      color: '#ef4444', // red-500
    };
  }

  if (entropy < ENTROPY_THRESHOLDS.fair) {
    return {
      level: 'fair',
      score: Math.round(20 + ((entropy - ENTROPY_THRESHOLDS.weak) / (ENTROPY_THRESHOLDS.fair - ENTROPY_THRESHOLDS.weak)) * 20),
      label: 'Passable',
      color: '#f97316', // orange-500
    };
  }

  if (entropy < ENTROPY_THRESHOLDS.good) {
    return {
      level: 'good',
      score: Math.round(40 + ((entropy - ENTROPY_THRESHOLDS.fair) / (ENTROPY_THRESHOLDS.good - ENTROPY_THRESHOLDS.fair)) * 20),
      label: 'Bon',
      color: '#eab308', // yellow-500
    };
  }

  if (entropy < ENTROPY_THRESHOLDS.strong) {
    return {
      level: 'strong',
      score: Math.round(60 + ((entropy - ENTROPY_THRESHOLDS.good) / (ENTROPY_THRESHOLDS.strong - ENTROPY_THRESHOLDS.good)) * 20),
      label: 'Fort',
      color: '#22c55e', // green-500
    };
  }

  return {
    level: 'excellent',
    score: Math.min(100, Math.round(80 + ((entropy - ENTROPY_THRESHOLDS.strong) / (ENTROPY_THRESHOLDS.excellent - ENTROPY_THRESHOLDS.strong)) * 20)),
    label: 'Excellent',
    color: '#06b6d4', // cyan-500
  };
}

/**
 * Formate l'entropie pour l'affichage
 */
export function formatEntropy(entropy: number): string {
  return `${entropy.toFixed(1)} bits`;
}

/**
 * Estime le temps de crack basé sur l'entropie
 * Hypothèse: 10 milliards de tentatives par seconde (GPU moderne)
 */
export function estimateCrackTime(entropy: number): string {
  const attemptsPerSecond = 10_000_000_000; // 10 billion
  const totalAttempts = Math.pow(2, entropy);
  const seconds = totalAttempts / attemptsPerSecond / 2; // Division par 2 pour moyenne

  if (seconds < 1) return 'Instantané';
  if (seconds < 60) return `${Math.round(seconds)} secondes`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} heures`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} jours`;
  if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} ans`;
  if (seconds < 31536000 * 1000000) return `${Math.round(seconds / 31536000 / 1000)} milliers d'années`;
  if (seconds < 31536000 * 1000000000) return `${Math.round(seconds / 31536000 / 1000000)} millions d'années`;

  return 'Pratiquement incassable';
}

/**
 * Génère une description complète de la force
 */
export function getStrengthDescription(entropy: number): string {
  const strength = calculateStrength(entropy);
  const crackTime = estimateCrackTime(entropy);

  return `${strength.label} (${formatEntropy(entropy)}) - Temps de crack estimé: ${crackTime}`;
}
