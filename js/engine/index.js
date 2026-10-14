/**
 * Public Facade for the V8 Calculator Engine
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Evaluator, ANGLE_RAD, ANGLE_DEG } from './evaluator.js';
import { Decimal } from './decimal.js';

export { ANGLE_RAD, ANGLE_DEG, Decimal };

export class CalculatorEngine {
  constructor(options = {}) {
    this.evaluator = new Evaluator();
    if (options.angleMode) {
      this.evaluator.setAngleMode(options.angleMode);
    }
  }

  setAngleMode(mode) {
    this.evaluator.setAngleMode(mode);
  }

  getAngleMode() {
    return this.evaluator.angleMode;
  }

  /**
   * Parse and calculate expression string
   * @param {string} expression 
   * @returns {string} Clean formatted result
   */
  calculate(expression) {
    if (!expression || !expression.trim()) return '0';
    const tokens = Lexer.tokenize(expression);
    const rpn = Parser.toRPN(tokens);
    const result = this.evaluator.evaluate(rpn);
    return result.toString();
  }
}
