/**
 * V8 Optimized RPN Stack Evaluator
 * High-throughput, zero-eval execution loop with angle mode support (Rad/Deg)
 * and precision decimal arithmetic.
 */

import {
  TYPE_NUMBER,
  TYPE_OPERATOR,
  TYPE_FUNCTION,
  TYPE_CONSTANT,
  CONSTANTS
} from './tokens.js';
import { Decimal } from './decimal.js';

export const ANGLE_RAD = 'rad';
export const ANGLE_DEG = 'deg';

export class Evaluator {
  constructor() {
    // Reusable stack array to minimize allocations across consecutive calculations
    this.stack = new Array(64);
    this.stackPtr = 0;
    this.angleMode = ANGLE_DEG; // Default to degrees for typical users
  }

  setAngleMode(mode) {
    if (mode === ANGLE_RAD || mode === ANGLE_DEG) {
      this.angleMode = mode;
    }
  }

  /**
   * Evaluate RPN token queue
   * @param {import('./tokens.js').Token[]} rpnQueue
   * @returns {Decimal}
   */
  evaluate(rpnQueue) {
    this.stackPtr = 0;
    const len = rpnQueue.length;

    for (let i = 0; i < len; i++) {
      const tok = rpnQueue[i];
      const type = tok.type;

      switch (type) {
        case TYPE_NUMBER:
          this.push(Decimal.fromString(tok.value));
          break;

        case TYPE_CONSTANT: {
          const val = CONSTANTS[tok.value];
          if (val === undefined) throw new Error(`Unknown constant: ${tok.value}`);
          this.push(Decimal.fromNumber(val));
          break;
        }

        case TYPE_OPERATOR: {
          const op = tok.value;
          if (tok.arity === 1) { // Unary operator
            const a = this.pop();
            if (op === 'u-') {
              this.push(a.negate());
            } else if (op === 'u+') {
              this.push(a);
            } else {
              throw new Error(`Unsupported unary operator: ${op}`);
            }
          } else { // Binary operator
            const b = this.pop();
            const a = this.pop();
            this.push(this._applyBinaryOp(op, a, b));
          }
          break;
        }

        case TYPE_FUNCTION: {
          const fnName = tok.value;
          const a = this.pop();
          this.push(this._applyFunction(fnName, a));
          break;
        }

        default:
          throw new Error(`Unexpected token type in evaluator: ${type}`);
      }
    }

    if (this.stackPtr !== 1) {
      throw new Error('Invalid expression: incomplete syntax');
    }

    return this.pop();
  }

  push(val) {
    if (this.stackPtr >= this.stack.length) {
      this.stack.length *= 2; // Grow if needed
    }
    this.stack[this.stackPtr++] = val;
  }

  pop() {
    if (this.stackPtr <= 0) {
      throw new Error('Malformed expression: insufficient operands');
    }
    const val = this.stack[--this.stackPtr];
    this.stack[this.stackPtr] = null; // Help GC
    return val;
  }

  _applyBinaryOp(op, a, b) {
    switch (op) {
      case '+': return a.add(b);
      case '-': return a.sub(b);
      case '*': return a.mul(b);
      case '/': return a.div(b);
      case '%': return a.mod(b);
      case '^': return a.pow(b);
      default: throw new Error(`Unknown binary operator: ${op}`);
    }
  }

  _applyFunction(fn, a) {
    const num = a.toNumber();

    switch (fn) {
      case 'sin': {
        const rad = this.angleMode === ANGLE_DEG ? (num * Math.PI) / 180 : num;
        // Fix float imprecision near zero for common angles e.g., sin(180 deg) = 0
        const res = Math.abs(Math.sin(rad)) < 1e-15 ? 0 : Math.sin(rad);
        return Decimal.fromNumber(res);
      }
      case 'cos': {
        const rad = this.angleMode === ANGLE_DEG ? (num * Math.PI) / 180 : num;
        const res = Math.abs(Math.cos(rad)) < 1e-15 ? 0 : Math.cos(rad);
        return Decimal.fromNumber(res);
      }
      case 'tan': {
        const rad = this.angleMode === ANGLE_DEG ? (num * Math.PI) / 180 : num;
        if (Math.abs(Math.cos(rad)) < 1e-15) {
          throw new Error('Tangent undefined at 90° / π/2');
        }
        const res = Math.abs(Math.tan(rad)) < 1e-15 ? 0 : Math.tan(rad);
        return Decimal.fromNumber(res);
      }
      case 'asin': {
        if (num < -1 || num > 1) throw new Error('Domain error: asin argument must be between -1 and 1');
        let res = Math.asin(num);
        if (this.angleMode === ANGLE_DEG) res = (res * 180) / Math.PI;
        return Decimal.fromNumber(res);
      }
      case 'acos': {
        if (num < -1 || num > 1) throw new Error('Domain error: acos argument must be between -1 and 1');
        let res = Math.acos(num);
        if (this.angleMode === ANGLE_DEG) res = (res * 180) / Math.PI;
        return Decimal.fromNumber(res);
      }
      case 'atan': {
        let res = Math.atan(num);
        if (this.angleMode === ANGLE_DEG) res = (res * 180) / Math.PI;
        return Decimal.fromNumber(res);
      }
      case 'sqrt': {
        if (num < 0) throw new Error('Domain error: square root of negative number');
        return Decimal.fromNumber(Math.sqrt(num));
      }
      case 'cbrt': {
        return Decimal.fromNumber(Math.cbrt(num));
      }
      case 'ln': {
        if (num <= 0) throw new Error('Domain error: ln argument must be > 0');
        return Decimal.fromNumber(Math.log(num));
      }
      case 'log': {
        if (num <= 0) throw new Error('Domain error: log argument must be > 0');
        return Decimal.fromNumber(Math.log10(num));
      }
      case 'abs': {
        return a.abs();
      }
      case 'exp': {
        return Decimal.fromNumber(Math.exp(num));
      }
      case 'fact': {
        if (num < 0 || !Number.isInteger(num)) throw new Error('Factorial requires non-negative integer');
        if (num > 170) throw new Error('Overflow: factorial result exceeds 64-bit limits');
        let f = 1n;
        for (let i = 2n; i <= BigInt(num); i++) {
          f *= i;
        }
        return new Decimal(f, 0);
      }
      default:
        throw new Error(`Unknown function: ${fn}`);
    }
  }
}
