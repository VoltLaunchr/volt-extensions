/**
 * EFF Large Wordlist Loader
 *
 * Charge la liste EFF officielle (7776 mots) pour Diceware.
 * Source: https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt
 *
 * Chaque mot = 12.925 bits d'entropie (log2(7776))
 * 6 mots = 77.55 bits d'entropie (recommandation NIST)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Cache pour éviter de relire le fichier
let cachedWordlist: string[] | null = null;

/**
 * Charge la wordlist EFF depuis le fichier texte
 * Format: "11111\tabacus" (numéros de dés + tab + mot)
 */
export function loadWordlist(): string[] {
  if (cachedWordlist) {
    return cachedWordlist;
  }

  try {
    const wordlistPath = join(__dirname, '..', 'eff_large_wordlist.txt');
    const content = readFileSync(wordlistPath, 'utf-8');

    cachedWordlist = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Format: "11111\tabacus"
        const parts = line.split('\t');
        return parts[1]?.trim() || '';
      })
      .filter(word => word.length > 0);

    if (cachedWordlist.length !== 7776) {
      console.warn(`Wordlist contains ${cachedWordlist.length} words instead of 7776`);
    }

    return cachedWordlist;
  } catch (error) {
    console.error('Failed to load EFF wordlist:', error);
    throw new Error('EFF wordlist not found. Please ensure eff_large_wordlist.txt is present.');
  }
}

/**
 * Obtient un mot par son index (0-7775)
 */
export function getWordByIndex(index: number): string {
  const wordlist = loadWordlist();

  if (index < 0 || index >= wordlist.length) {
    throw new Error(`Index ${index} out of bounds (0-${wordlist.length - 1})`);
  }

  return wordlist[index];
}

/**
 * Retourne le nombre total de mots dans la liste
 */
export function getWordlistSize(): number {
  return loadWordlist().length;
}

/**
 * Calcule l'entropie en bits pour un nombre de mots donné
 * Formule: bits = wordCount * log2(7776)
 */
export function calculateDicewareEntropy(wordCount: number): number {
  const wordlistSize = getWordlistSize();
  return wordCount * Math.log2(wordlistSize);
}
