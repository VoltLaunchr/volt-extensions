import { Plugin, PluginContext, PluginResult, PluginResultType } from '../../types';
import { copyToClipboard } from '../../utils/helpers';
import { detectQueryType, parseQuery } from './parsers/queryParser';
import { evaluateMathExpression } from './converters/math';
import { convertUnit } from './converters/units';
import {
  calculateCountdown,
  calculateDateArithmetic,
  calculateFutureWeekday,
} from './converters/dates';
import { convertTimezone, getCurrentTimeInZone } from './converters/timezone';
import { formatNumber, formatWithUnit } from './utils/formatting';
import { addToHistory } from './utils/history';
import type { SpecificQuery } from './types';

// Export the view component
export { CalculatorView } from './components/CalculatorView';

export class CalculatorPlugin implements Plugin {
  id = 'calculator';
  name = 'Calculator';
  description = 'Math, unit conversions, date calculations, and timezone conversions';
  enabled = true;

  /**
   * Check if query can be handled by calculator
   */
  canHandle(context: PluginContext): boolean {
    const query = context.query.trim();
    if (!query) return false;

    // Delegate to parser for detection
    const queryType = detectQueryType(query);
    return queryType !== null;
  }

  /**
   * Match query and return results
   */
  match(context: PluginContext): PluginResult[] | null {
    const query = context.query.trim();

    // Parse query to determine type and extract parameters
    const parsed = parseQuery(query);
    if (!parsed) return null;

    // Delegate to appropriate handler based on query type
    switch (parsed.type) {
      case 'math':
        return this.handleMath(parsed);
      case 'unit':
        return this.handleUnitConversion(parsed);
      case 'date':
        return this.handleDateCalculation(parsed);
      case 'timezone':
        return this.handleTimezoneConversion(parsed);
      default:
        return null;
    }
  }

  /**
   * Execute when user selects a result
   */
  async execute(result: PluginResult): Promise<void> {
    const formatted = (result.data?.formatted as string) || result.title;
    const success = await copyToClipboard(formatted);

    if (success) {
      console.log(`✓ Copied to clipboard: ${formatted}`);

      // Add to history
      const queryType = result.data?.queryType as 'math' | 'unit' | 'date' | 'timezone';
      if (queryType) {
        const query = (result.data?.expression as string) || result.subtitle?.split(' = ')[0] || '';

        addToHistory({
          query,
          result: formatted,
          type: queryType,
        });
      }
    }
  }

  /**
   * Handle math expressions
   */
  private handleMath(parsed: SpecificQuery): PluginResult[] | null {
    if (parsed.type !== 'math') return null;

    const expression = parsed.params.expression;
    const result = evaluateMathExpression(expression);

    if (result === null) {
      return null;
    }

    const formatted = formatNumber(result);

    return [
      {
        id: `calc-math-${Date.now()}`,
        type: PluginResultType.Calculator,
        title: formatted,
        subtitle: `${expression} = ${formatted}`,
        score: 95,
        data: {
          queryType: 'math',
          expression,
          result,
          formatted,
        },
      },
    ];
  }

  /**
   * Handle unit conversions
   */
  private handleUnitConversion(parsed: SpecificQuery): PluginResult[] | null {
    if (parsed.type !== 'unit') return null;

    const { value, from, to } = parsed.params;

    // Convert the unit
    const result = convertUnit(value, from, to);

    if (!result) {
      return null; // Invalid conversion
    }

    // Format the result with unit
    const formatted = formatWithUnit(result.value, result.toUnit);
    const inputFormatted = formatWithUnit(value, from);

    return [
      {
        id: `calc-unit-${Date.now()}`,
        type: PluginResultType.Calculator,
        title: formatted,
        subtitle: `${inputFormatted} = ${formatted}`,
        score: 95,
        data: {
          queryType: 'unit',
          value,
          from,
          to,
          result: result.value,
          formatted,
          category: result.category,
        },
      },
    ];
  }

  /**
   * Handle date calculations
   */
  private handleDateCalculation(parsed: SpecificQuery): PluginResult[] | null {
    if (parsed.type !== 'date') return null;

    const { operation } = parsed.params;
    let result = null;

    switch (operation) {
      case 'countdown':
        result = calculateCountdown(parsed.params.target);
        break;
      case 'arithmetic':
        result = calculateDateArithmetic(
          parsed.params.base,
          parsed.params.operator,
          parsed.params.amount,
          parsed.params.unit
        );
        break;
      case 'future_weekday':
        result = calculateFutureWeekday(
          parsed.params.weekday,
          parsed.params.amount,
          parsed.params.unit
        );
        break;
    }

    if (!result) {
      return null;
    }

    return [
      {
        id: `calc-date-${Date.now()}`,
        type: PluginResultType.Calculator,
        title: result.formatted,
        subtitle: result.description,
        score: 95,
        data: {
          queryType: 'date',
          operation,
          result: result.value,
          formatted: result.formatted,
          description: result.description,
        },
      },
    ];
  }

  /**
   * Handle timezone conversions
   */
  private handleTimezoneConversion(parsed: SpecificQuery): PluginResult[] | null {
    if (parsed.type !== 'timezone') return null;

    const { operation } = parsed.params;
    let result = null;

    switch (operation) {
      case 'convert':
        result = convertTimezone(parsed.params.time, parsed.params.fromZone, parsed.params.toZone);
        break;
      case 'current_time':
        result = getCurrentTimeInZone(parsed.params.zone);
        break;
    }

    if (!result) {
      return null;
    }

    return [
      {
        id: `calc-timezone-${Date.now()}`,
        type: PluginResultType.Calculator,
        title: result.formatted,
        subtitle: result.description,
        score: 95,
        data: {
          queryType: 'timezone',
          operation,
          formatted: result.formatted,
          description: result.description,
          timezone: result.timezone,
        },
      },
    ];
  }
}
