/**
 * V8 Micro-Benchmark
 * Measures throughput (ops/sec) and allocation characteristics under high load.
 */

import { CalculatorEngine } from '../js/engine/index.js';

const calc = new CalculatorEngine();
const iterations = 50000;

const expressions = [
  '128.5 + 256.75 * 3 - 40 / 5',
  '(10 + 20) * (30 - 15) / 2',
  'sin(45) + cos(45) * 2',
  '0.1 + 0.2 + 0.3 * 4',
  'sqrt(144) + 2^8'
];

console.log(`--- Running V8 Performance Benchmark (${iterations} cycles * ${expressions.length} exprs) ---`);

// Warm up V8 JIT Turbofan optimizer
for (let i = 0; i < 5000; i++) {
  for (const expr of expressions) {
    calc.calculate(expr);
  }
}

const memBefore = process.memoryUsage().heapUsed;
const startTime = performance.now();

for (let i = 0; i < iterations; i++) {
  for (const expr of expressions) {
    calc.calculate(expr);
  }
}

const elapsedMs = performance.now() - startTime;
const memAfter = process.memoryUsage().heapUsed;
const totalOperations = iterations * expressions.length;
const opsPerSec = Math.round((totalOperations / elapsedMs) * 1000);

console.log(`Total Operations: ${totalOperations.toLocaleString()}`);
console.log(`Elapsed Time:     ${elapsedMs.toFixed(2)} ms`);
console.log(`Throughput:       ${opsPerSec.toLocaleString()} ops/sec`);
console.log(`Heap Delta:       ${((memAfter - memBefore) / 1024 / 1024).toFixed(2)} MB`);
console.log('✔ V8 Benchmark complete!\n');
