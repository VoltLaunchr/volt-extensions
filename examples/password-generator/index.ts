/**
 * Password Generator Plugin
 *
 * Generates cryptographically secure passwords using:
 * - Node.js crypto.randomInt() for character-based passwords
 * - EFF Diceware wordlist (7776 words) for passphrases
 *
 * Standards: NIST SP 800-63B, EFF Diceware
 */

import {
  Plugin,
  PluginContext,
  PluginResult,
  PluginResultType,
} from '../../api/typescript/src/types';
import { isPasswordQuery, parsePasswordQuery, describeQuery } from './parsers/queryParser';
import { generate } from './utils/generator';
import { formatEntropy, estimateCrackTime, calculateStrength } from './utils/strength';
import { GeneratedPassword } from './types';

// Export the view component
export { PasswordView } from './components/PasswordView';

// Helper provided by Volt runtime
const copyToClipboard = (text: string): boolean => {
  console.log('Copy to clipboard:', text);
  return true;
};

export class PasswordGeneratorPlugin implements Plugin {
  id = 'password-generator';
  name = 'Password Generator';
  description = 'Generate secure passwords, passphrases, and PINs';
  enabled = true;

  /**
   * Check if query can be handled by password generator
   */
  canHandle(context: PluginContext): boolean {
    return isPasswordQuery(context.query);
  }

  /**
   * Match query and return results
   */
  match(context: PluginContext): PluginResult[] | null {
    const query = context.query.trim();
    const parsed = parsePasswordQuery(query);

    if (!parsed) {
      return null;
    }

    try {
      const generated = generate(
        parsed.mode,
        parsed.mode === 'phrase' ? parsed.wordCount : parsed.length,
        parsed.separator
      );

      return [this.createResult(generated, parsed.mode, query)];
    } catch (error) {
      console.error('Password generation error:', error);
      return null;
    }
  }

  /**
   * Execute when user selects a result
   */
  async execute(result: PluginResult): Promise<void> {
    const password = result.data?.password as string;

    if (password) {
      const success = await copyToClipboard(password);
      if (success) {
        console.log('Password copied to clipboard');
      }
    }
  }

  /**
   * Create a plugin result from generated password
   */
  private createResult(
    generated: GeneratedPassword,
    mode: string,
    query: string
  ): PluginResult {
    const strength = calculateStrength(generated.entropy);
    const crackTime = estimateCrackTime(generated.entropy);

    return {
      id: `pass-${Date.now()}`,
      type: PluginResultType.Password,
      title: generated.value,
      subtitle: `${strength.label} - ${formatEntropy(generated.entropy)} - ${crackTime}`,
      score: 100,
      data: {
        password: generated.value,
        mode: generated.mode,
        entropy: generated.entropy,
        strength: generated.strength,
        characterCount: generated.characterCount,
        query,
      },
    };
  }
}

// Default export for plugin registration
export default PasswordGeneratorPlugin;
