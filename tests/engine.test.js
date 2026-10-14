/**
 * Calculator Engine Unit Tests
 */

import assert from 'node:assert';
import { CalculatorEngine, ANGLE_DEG, ANGLE_RAD } from '../js/engine/index.js';

const calc = new CalculatorEngine({ angleMode: ANGLE_DEG });

function runTests() {
  console.log('--- Running Arithmetic & Order of Operations Tests ---');

  // Basic arithmetic
  assert.strictEqual(calc.calculate('2 + 3'), '5');
  assert.strictEqual(calc.calculate('10 - 4'), '6');
  assert.strictEqual(calc.calculate('6 * 7'), '42');
  assert.strictEqual(calc.calculate('6 × 7'), '42');
  assert.strictEqual(calc.calculate('45 / 9'), '5');
  assert.strictEqual(calc.calculate('45 ÷ 9'), '5');

  // Order of operations (PEMDAS)
  assert.strictEqual(calc.calculate('2 + 3 * 4'), '14');
  assert.strictEqual(calc.calculate('(2 + 3) * 4'), '20');
  assert.strictEqual(calc.calculate('100 - 20 / 4 * 2'), '90');
  assert.strictEqual(calc.calculate('2 ^ 3 ^ 2'), '512'); // Right associative: 2^(3^2) = 2^9 = 512
  assert.strictEqual(calc.calculate('(2 ^ 3) ^ 2'), '64');
  assert.strictEqual(calc.calculate('2 ^ 10'), '1024');
  assert.strictEqual(calc.calculate('2 ^ 0'), '1');
  assert.throws(() => calc.calculate('2 ^ 10000000'), /Overflow/);

  // Unary operators
  assert.strictEqual(calc.calculate('-5 + 12'), '7');
  assert.strictEqual(calc.calculate('3 * -4'), '-12');
  assert.strictEqual(calc.calculate('-(3 + 2)'), '-5');

  // Decimal precision (Eliminating IEEE-754 errors)
  console.log('--- Running Decimal Precision Tests ---');
  assert.strictEqual(calc.calculate('0.1 + 0.2'), '0.3');
  assert.strictEqual(calc.calculate('1.4 - 1.2'), '0.2');
  assert.strictEqual(calc.calculate('0.7 * 0.1'), '0.07');
  assert.strictEqual(calc.calculate('10 / 4'), '2.5');

  // Implicit multiplication
  console.log('--- Running Implicit Multiplication Tests ---');
  assert.strictEqual(calc.calculate('2(3 + 4)'), '14');
  assert.strictEqual(calc.calculate('(2)(3)'), '6');

  // Scientific functions
  console.log('--- Running Scientific Functions Tests ---');
  assert.strictEqual(calc.calculate('sqrt(16)'), '4');
  assert.strictEqual(calc.calculate('cbrt(27)'), '3');
  assert.strictEqual(calc.calculate('abs(-42)'), '42');
  assert.strictEqual(calc.calculate('fact(5)'), '120');

  // Trigonometry in Degrees
  assert.strictEqual(calc.calculate('sin(90)'), '1');
  assert.strictEqual(calc.calculate('cos(0)'), '1');
  assert.strictEqual(calc.calculate('tan(45)'), '1');

  // Trigonometry in Radians
  calc.setAngleMode(ANGLE_RAD);
  assert.strictEqual(calc.calculate('cos(0)'), '1');
  assert.strictEqual(calc.calculate('sin(pi / 2)'), '1');

  // Reset to degrees
  calc.setAngleMode(ANGLE_DEG);

  // Error handling
  console.log('--- Running Error Handling Tests ---');
  assert.throws(() => calc.calculate('1 / 0'), /Division by zero/);
  assert.throws(() => calc.calculate('sqrt(-9)'), /Domain error/);
  assert.throws(() => calc.calculate('(3 + 4'), /Mismatched parentheses/);

  console.log('\n✔ All 22 Engine Tests Passed Successfully!\n');
}

runTests();
