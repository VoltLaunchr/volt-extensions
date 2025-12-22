/**
 * Enhanced math expression evaluator
 * Supports:
 * - Basic operations: +, -, *, /, %, ^
 * - Scientific functions: sqrt, sin, cos, tan, log, ln, abs
 * - Constants: pi, e
 */

/**
 * Evaluate a mathematical expression with scientific functions support
 * @param expr The expression to evaluate
 * @returns The result or null if invalid
 */
export function evaluateMathExpression(expr: string): number | null {
  try {
    // Clean the expression
    let cleaned = expr.trim().replace(/\s+/g, '');

    // Replace constants
    cleaned = replaceConstants(cleaned);

    // Process scientific functions
    cleaned = processScientificFunctions(cleaned);

    // Only allow safe characters after processing
    if (!/^[\d+\-*/.()%^]+$/.test(cleaned)) {
      return null;
    }

    // Prevent dangerous patterns
    if (cleaned.includes('//') || cleaned.includes('/*')) {
      return null;
    }

    // Replace ^ with ** for exponentiation
    const normalized = cleaned.replace(/\^/g, '**');

    // Use Function constructor for safe evaluation (better than eval)
    const result = new Function(`'use strict'; return (${normalized})`)();

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Replace mathematical constants with their values
 */
function replaceConstants(expr: string): string {
  return expr
    .replace(/\bpi\b/gi, Math.PI.toString())
    .replace(/\be\b/gi, Math.E.toString());
}

/**
 * Process scientific functions and replace them with their computed values
 */
function processScientificFunctions(expr: string): string {
  let processed = expr;

  // Process functions multiple times to handle nested functions
  // e.g., sqrt(sin(45))
  let maxIterations = 10; // Prevent infinite loops
  let changed = true;

  while (changed && maxIterations-- > 0) {
    const before = processed;

    // sqrt(x)
    processed = processed.replace(/sqrt\s*\(\s*([^()]+)\s*\)/gi, (_match, arg) => {
      const val = evaluateSimple(arg);
      return val !== null ? Math.sqrt(val).toString() : _match;
    });

    // sin(x) - expects degrees by default
    processed = processed.replace(/sin\s*\(\s*([^()]+)\s*\)/gi, (_match, arg) => {
      const val = evaluateSimple(arg);
      if (val === null) return _match;
      const radians = (val * Math.PI) / 180;
      return Math.sin(radians).toString();
    });

    // cos(x) - expects degrees by default
    processed = processed.replace(/cos\s*\(\s*([^()]+)\s*\)/gi, (_match, arg) => {
      const val = evaluateSimple(arg);
      if (val === null) return _match;
      const radians = (val * Math.PI) / 180;
      return Math.cos(radians).toString();
    });

    // tan(x) - expects degrees by default
    processed = processed.replace(/tan\s*\(\s*([^()]+)\s*\)/gi, (_match, arg) => {
      const val = evaluateSimple(arg);
      if (val === null) return _match;
      const radians = (val * Math.PI) / 180;
      return Math.tan(radians).toString();
    });

    // log(x) - base 10
    processed = processed.replace(/log\s*\(\s*([^()]+)\s*\)/gi, (_match, arg) => {
      const val = evaluateSimple(arg);
      return val !== null && val > 0 ? Math.log10(val).toString() : _match;
    });

    // ln(x) - natural log
    processed = processed.replace(/ln\s*\(\s*([^()]+)\s*\)/gi, (_match, arg) => {
      const val = evaluateSimple(arg);
      return val !== null && val > 0 ? Math.log(val).toString() : _match;
    });

    // abs(x)
    processed = processed.replace(/abs\s*\(\s*([^()]+)\s*\)/gi, (_match, arg) => {
      const val = evaluateSimple(arg);
      return val !== null ? Math.abs(val).toString() : _match;
    });

    changed = processed !== before;
  }

  return processed;
}

/**
 * Evaluate a simple expression (no functions)
 * Used for evaluating function arguments
 */
function evaluateSimple(expr: string): number | null {
  try {
    const cleaned = expr.trim();

    // Allow only numbers and basic operators
    if (!/^[\d+\-*/.()%^.]+$/.test(cleaned)) {
      return null;
    }

    const normalized = cleaned.replace(/\^/g, '**');
    const result = new Function(`'use strict'; return (${normalized})`)();

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }

    return null;
  } catch {
    return null;
  }
}
