/**
 * V8 Optimized Lexer
 * Iterative character scanner avoiding heavy regex overhead.
 * Emits monomorphic Token objects and supports implicit multiplication and unary signs.
 */

import {
  Token,
  TYPE_NUMBER,
  TYPE_OPERATOR,
  TYPE_FUNCTION,
  TYPE_LPAREN,
  TYPE_RPAREN,
  TYPE_CONSTANT,
  OPERATORS,
  FUNCTIONS,
  CONSTANTS,
  ASSOC_LEFT,
  ASSOC_RIGHT
} from './tokens.js';

export class Lexer {
  /**
   * Tokenize mathematical expression string
   * @param {string} input 
   * @returns {Token[]}
   */
  static tokenize(input) {
    const len = input.length;
    const tokens = [];
    let i = 0;
    let prevToken = null;

    while (i < len) {
      const ch = input.charCodeAt(i);

      // Skip whitespace: space, tab, newline
      if (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
        i++;
        continue;
      }

      // 1. Number detection: digits 0-9 (48-57) or '.' (46)
      if ((ch >= 48 && ch <= 57) || ch === 46) {
        let start = i;
        let hasDot = ch === 46;
        i++;

        while (i < len) {
          const c = input.charCodeAt(i);
          if (c >= 48 && c <= 57) {
            i++;
          } else if (c === 46 && !hasDot) {
            hasDot = true;
            i++;
          } else if ((c === 101 || c === 69) && i + 1 < len) { // 'e' or 'E'
            const next = input.charCodeAt(i + 1);
            if (next === 43 || next === 45 || (next >= 48 && next <= 57)) { // '+', '-', or digit
              i += 2;
              while (i < len && input.charCodeAt(i) >= 48 && input.charCodeAt(i) <= 57) {
                i++;
              }
              break;
            }
            break;
          } else {
            break;
          }
        }

        const numStr = input.slice(start, i);
        // Implicit multiplication check: if previous token was RPAREN or CONSTANT
        if (prevToken && (prevToken.type === TYPE_RPAREN || prevToken.type === TYPE_CONSTANT)) {
          tokens.push(new Token(TYPE_OPERATOR, '*', OPERATORS['*'].precedence, ASSOC_LEFT, 2));
        }

        const tok = new Token(TYPE_NUMBER, numStr, 0, ASSOC_LEFT, 0);
        tokens.push(tok);
        prevToken = tok;
        continue;
      }

      // 2. Parentheses
      if (ch === 40) { // '('
        // Implicit multiplication: e.g. 5(2) or (1)(2)
        if (prevToken && (prevToken.type === TYPE_NUMBER || prevToken.type === TYPE_RPAREN || prevToken.type === TYPE_CONSTANT)) {
          tokens.push(new Token(TYPE_OPERATOR, '*', OPERATORS['*'].precedence, ASSOC_LEFT, 2));
        }
        const tok = new Token(TYPE_LPAREN, '(', 0, ASSOC_LEFT, 0);
        tokens.push(tok);
        prevToken = tok;
        i++;
        continue;
      }

      if (ch === 41) { // ')'
        const tok = new Token(TYPE_RPAREN, ')', 0, ASSOC_LEFT, 0);
        tokens.push(tok);
        prevToken = tok;
        i++;
        continue;
      }

      // 3. Operators: +, -, *, /, ×, ÷, %, ^
      const charStr = input.charAt(i);
      let opKey = charStr;

      // Normalize unicode operator symbols
      if (charStr === '×') opKey = '*';
      if (charStr === '÷') opKey = '/';

      if (OPERATORS[opKey]) {
        // Disambiguate unary + or -
        // Unary if at start or immediately following an operator or LPAREN
        const isUnary = !prevToken || prevToken.type === TYPE_OPERATOR || prevToken.type === TYPE_LPAREN;
        if (isUnary && (opKey === '-' || opKey === '+')) {
          const unaryKey = 'u' + opKey;
          const opDef = OPERATORS[unaryKey];
          const tok = new Token(TYPE_OPERATOR, unaryKey, opDef.precedence, opDef.assoc, opDef.arity);
          tokens.push(tok);
          prevToken = tok;
        } else {
          const opDef = OPERATORS[opKey];
          const tok = new Token(TYPE_OPERATOR, opKey, opDef.precedence, opDef.assoc, opDef.arity);
          tokens.push(tok);
          prevToken = tok;
        }
        i++;
        continue;
      }

      // 4. Identifiers: Constants (π) or Function names (sin, cos, etc.)
      if (charStr === 'π') {
        if (prevToken && (prevToken.type === TYPE_NUMBER || prevToken.type === TYPE_RPAREN || prevToken.type === TYPE_CONSTANT)) {
          tokens.push(new Token(TYPE_OPERATOR, '*', OPERATORS['*'].precedence, ASSOC_LEFT, 2));
        }
        const tok = new Token(TYPE_CONSTANT, 'π', 0, ASSOC_LEFT, 0);
        tokens.push(tok);
        prevToken = tok;
        i++;
        continue;
      }

      // Word-based identifiers [a-zA-Z]
      if ((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122)) {
        let start = i;
        while (i < len) {
          const c = input.charCodeAt(i);
          if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57)) {
            i++;
          } else {
            break;
          }
        }
        const word = input.slice(start, i).toLowerCase();

        // Check if constant (pi, e)
        if (CONSTANTS[word] !== undefined) {
          if (prevToken && (prevToken.type === TYPE_NUMBER || prevToken.type === TYPE_RPAREN || prevToken.type === TYPE_CONSTANT)) {
            tokens.push(new Token(TYPE_OPERATOR, '*', OPERATORS['*'].precedence, ASSOC_LEFT, 2));
          }
          const tok = new Token(TYPE_CONSTANT, word, 0, ASSOC_LEFT, 0);
          tokens.push(tok);
          prevToken = tok;
          continue;
        }

        // Check if function (sin, cos, sqrt...)
        if (FUNCTIONS[word]) {
          if (prevToken && (prevToken.type === TYPE_NUMBER || prevToken.type === TYPE_RPAREN || prevToken.type === TYPE_CONSTANT)) {
            tokens.push(new Token(TYPE_OPERATOR, '*', OPERATORS['*'].precedence, ASSOC_LEFT, 2));
          }
          const tok = new Token(TYPE_FUNCTION, word, 0, ASSOC_LEFT, FUNCTIONS[word].arity);
          tokens.push(tok);
          prevToken = tok;
          continue;
        }

        throw new Error(`Unknown identifier: "${word}"`);
      }

      // Unknown character
      throw new Error(`Unexpected character: "${charStr}" at position ${i}`);
    }

    return tokens;
  }
}
