/**
 * V8 Optimized Token System
 * Smi-tagged constants and monomorphic token classes for maximum inline cache efficiency.
 */

// Smi (Small Integer) Token Types for fast V8 bitwise checks
export const TYPE_NUMBER = 1;
export const TYPE_OPERATOR = 2;
export const TYPE_FUNCTION = 3;
export const TYPE_LPAREN = 4;
export const TYPE_RPAREN = 5;
export const TYPE_CONSTANT = 6;
export const TYPE_COMMA = 7;

// Associativity constants
export const ASSOC_LEFT = 0;
export const ASSOC_RIGHT = 1;

/**
 * Monomorphic Token structure:
 * Consistent property layout in V8 ensures stable Hidden Classes (Shapes)
 * preventing deoptimization in the Shunting-Yard parser and evaluator loops.
 */
export class Token {
  constructor(type, value, precedence = 0, assoc = ASSOC_LEFT, arity = 0) {
    this.type = type | 0;
    this.value = value;
    this.precedence = precedence | 0;
    this.assoc = assoc | 0;
    this.arity = arity | 0;
  }
}

// Operators definitions
export const OPERATORS = Object.freeze({
  '+': { precedence: 2, assoc: ASSOC_LEFT, arity: 2 },
  '-': { precedence: 2, assoc: ASSOC_LEFT, arity: 2 },
  '×': { precedence: 3, assoc: ASSOC_LEFT, arity: 2 },
  '*': { precedence: 3, assoc: ASSOC_LEFT, arity: 2 },
  '÷': { precedence: 3, assoc: ASSOC_LEFT, arity: 2 },
  '/': { precedence: 3, assoc: ASSOC_LEFT, arity: 2 },
  '%': { precedence: 3, assoc: ASSOC_LEFT, arity: 2 },
  '^': { precedence: 4, assoc: ASSOC_RIGHT, arity: 2 },
  'u-': { precedence: 5, assoc: ASSOC_RIGHT, arity: 1 }, // Unary minus
  'u+': { precedence: 5, assoc: ASSOC_RIGHT, arity: 1 }  // Unary plus
});

// Scientific Functions
export const FUNCTIONS = Object.freeze({
  'sin': { arity: 1 },
  'cos': { arity: 1 },
  'tan': { arity: 1 },
  'asin': { arity: 1 },
  'acos': { arity: 1 },
  'atan': { arity: 1 },
  'sqrt': { arity: 1 },
  'cbrt': { arity: 1 },
  'ln': { arity: 1 },
  'log': { arity: 1 }, // log10
  'abs': { arity: 1 },
  'exp': { arity: 1 },
  'fact': { arity: 1 } // factorial n!
});

// Constants
export const CONSTANTS = Object.freeze({
  'π': Math.PI,
  'pi': Math.PI,
  'e': Math.E
});
