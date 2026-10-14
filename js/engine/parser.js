/**
 * Dijkstra's Shunting-Yard Algorithm
 * Transforms infix Token streams to Reverse Polish Notation (RPN) queues
 * using pre-allocated stacks and zero-eval compilation for optimal V8 JIT execution.
 */

import {
  TYPE_NUMBER,
  TYPE_OPERATOR,
  TYPE_FUNCTION,
  TYPE_LPAREN,
  TYPE_RPAREN,
  TYPE_CONSTANT,
  ASSOC_LEFT
} from './tokens.js';

export class Parser {
  /**
   * Convert infix token array to RPN (postfix) token array
   * @param {import('./tokens.js').Token[]} tokens 
   * @returns {import('./tokens.js').Token[]}
   */
  static toRPN(tokens) {
    const outputQueue = [];
    const opStack = [];

    const len = tokens.length;
    for (let i = 0; i < len; i++) {
      const tok = tokens[i];
      const type = tok.type;

      switch (type) {
        case TYPE_NUMBER:
        case TYPE_CONSTANT:
          outputQueue.push(tok);
          break;

        case TYPE_FUNCTION:
          opStack.push(tok);
          break;

        case TYPE_OPERATOR: {
          const p1 = tok.precedence;
          const isLeft = tok.assoc === ASSOC_LEFT;

          while (opStack.length > 0) {
            const top = opStack[opStack.length - 1];
            if (top.type === TYPE_LPAREN) break;

            const p2 = top.precedence;
            if ((isLeft && p1 <= p2) || (!isLeft && p1 < p2)) {
              outputQueue.push(opStack.pop());
            } else {
              break;
            }
          }
          opStack.push(tok);
          break;
        }

        case TYPE_LPAREN:
          opStack.push(tok);
          break;

        case TYPE_RPAREN: {
          let matched = false;
          while (opStack.length > 0) {
            const top = opStack.pop();
            if (top.type === TYPE_LPAREN) {
              matched = true;
              break;
            }
            outputQueue.push(top);
          }
          if (!matched) {
            throw new Error('Mismatched parentheses: closing bracket without opening bracket');
          }
          // If the token at top of stack is a function, pop it to output
          if (opStack.length > 0 && opStack[opStack.length - 1].type === TYPE_FUNCTION) {
            outputQueue.push(opStack.pop());
          }
          break;
        }

        default:
          throw new Error(`Unexpected token type in parser: ${type}`);
      }
    }

    // Drain remaining operators from stack
    while (opStack.length > 0) {
      const top = opStack.pop();
      if (top.type === TYPE_LPAREN || top.type === TYPE_RPAREN) {
        throw new Error('Mismatched parentheses: unclosed bracket');
      }
      outputQueue.push(top);
    }

    return outputQueue;
  }
}
