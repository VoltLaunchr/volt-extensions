/**
 * EFF Large Wordlist Loader (Browser-compatible)
 *
 * Charge la liste EFF officielle (7776 mots) pour Diceware via fetch.
 * Source: https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt
 *
 * Chaque mot = 12.925 bits d'entropie (log2(7776))
 * 6 mots = 77.55 bits d'entropie (recommandation NIST)
 */

const EFF_WORDLIST_URL = 'https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt';

// Cache pour éviter de re-télécharger
let cachedWordlist: string[] | null = null;
let loadingPromise: Promise<string[]> | null = null;

/**
 * Charge la wordlist EFF depuis le web
 * Format: "11111\tabacus" (numéros de dés + tab + mot)
 */
export async function loadWordlist(): Promise<string[]> {
  if (cachedWordlist) {
    return cachedWordlist;
  }

  // Si déjà en cours de chargement, attendre
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const response = await fetch(EFF_WORDLIST_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch wordlist: ${response.status}`);
      }

      const content = await response.text();

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
      // Fallback: utiliser une petite liste de mots courants
      cachedWordlist = getFallbackWordlist();
      return cachedWordlist;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Obtient un mot par son index (0-7775)
 * Note: Cette fonction est maintenant synchrone et utilise le cache
 */
export function getWordByIndex(index: number): string {
  if (!cachedWordlist) {
    // Si pas encore chargé, utiliser le fallback
    const fallback = getFallbackWordlist();
    return fallback[index % fallback.length];
  }

  if (index < 0 || index >= cachedWordlist.length) {
    return cachedWordlist[Math.abs(index) % cachedWordlist.length];
  }

  return cachedWordlist[index];
}

/**
 * Retourne le nombre total de mots dans la liste
 */
export function getWordlistSize(): number {
  if (!cachedWordlist) {
    return getFallbackWordlist().length;
  }
  return cachedWordlist.length;
}

/**
 * Calcule l'entropie en bits pour un nombre de mots donné
 * Formule: bits = wordCount * log2(wordlistSize)
 */
export function calculateDicewareEntropy(wordCount: number): number {
  const wordlistSize = getWordlistSize();
  return wordCount * Math.log2(wordlistSize);
}

/**
 * Initialise la wordlist (à appeler au démarrage du plugin)
 */
export async function initWordlist(): Promise<void> {
  await loadWordlist();
}

/**
 * Liste de mots de secours si le fetch échoue
 * 256 mots = 8 bits d'entropie par mot
 */
function getFallbackWordlist(): string[] {
  return [
    'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'harbor',
    'island', 'jungle', 'kingdom', 'lantern', 'mountain', 'network', 'ocean', 'palace',
    'quantum', 'river', 'sunset', 'thunder', 'umbrella', 'valley', 'window', 'yellow',
    'zebra', 'anchor', 'bridge', 'castle', 'dolphin', 'engine', 'falcon', 'guitar',
    'hammer', 'iceberg', 'jacket', 'kitten', 'lemon', 'marble', 'needle', 'orange',
    'pencil', 'quartz', 'rocket', 'silver', 'tiger', 'universe', 'violet', 'wizard',
    'crystal', 'diamond', 'emerald', 'phoenix', 'sapphire', 'tornado', 'volcano', 'whisper',
    'bamboo', 'canyon', 'desert', 'eclipse', 'firefly', 'glacier', 'horizon', 'ivory',
    'jasmine', 'kelp', 'lotus', 'meteor', 'nebula', 'oasis', 'pyramid', 'quiver',
    'rapids', 'sphinx', 'temple', 'utopia', 'vortex', 'willow', 'xenon', 'yonder',
    'zenith', 'breeze', 'comet', 'dusk', 'ember', 'frost', 'grove', 'haze',
    'inlet', 'jewel', 'karma', 'lunar', 'mist', 'nova', 'orbit', 'prism',
    'quest', 'reef', 'storm', 'tide', 'unity', 'vista', 'wave', 'zephyr',
    'alpha', 'beta', 'gamma', 'delta', 'sigma', 'omega', 'theta', 'lambda',
    'cosmic', 'stellar', 'galactic', 'astral', 'celestial', 'ethereal', 'radiant', 'luminous',
    'serene', 'tranquil', 'peaceful', 'harmony', 'balance', 'wisdom', 'courage', 'honor',
    'spirit', 'energy', 'power', 'force', 'motion', 'velocity', 'momentum', 'gravity',
    'particle', 'atom', 'molecule', 'element', 'compound', 'reaction', 'fusion', 'fission',
    'spectrum', 'frequency', 'amplitude', 'resonance', 'vibration', 'oscillation', 'pulse', 'rhythm',
    'melody', 'harmony', 'symphony', 'chorus', 'verse', 'refrain', 'bridge', 'coda',
    'canvas', 'palette', 'brush', 'sketch', 'portrait', 'landscape', 'abstract', 'mosaic',
    'sculpture', 'ceramic', 'bronze', 'marble', 'granite', 'obsidian', 'jade', 'amber',
    'velvet', 'silk', 'cotton', 'linen', 'wool', 'cashmere', 'leather', 'suede',
    'crimson', 'scarlet', 'azure', 'cobalt', 'emerald', 'jade', 'amber', 'ivory',
    'raven', 'sparrow', 'falcon', 'eagle', 'hawk', 'owl', 'crane', 'swan',
    'panther', 'leopard', 'jaguar', 'cheetah', 'wolf', 'fox', 'bear', 'lion',
    'maple', 'oak', 'pine', 'cedar', 'birch', 'willow', 'elm', 'ash',
    'rose', 'lily', 'tulip', 'orchid', 'daisy', 'iris', 'lotus', 'jasmine',
    'sage', 'mint', 'basil', 'thyme', 'rosemary', 'lavender', 'chamomile', 'ginger',
    'cinnamon', 'vanilla', 'cocoa', 'coffee', 'honey', 'maple', 'caramel', 'truffle',
    'summit', 'peak', 'ridge', 'cliff', 'gorge', 'ravine', 'plateau', 'mesa',
    'lagoon', 'bay', 'cove', 'inlet', 'strait', 'channel', 'delta', 'estuary',
  ];
}
