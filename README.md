# Simple JS Calculator (V8 Precision)

An ultra-fast, zero-dependency, precision-engineered calculator designed specifically for the **Google V8 JavaScript Engine** (Chrome/Chromium Desktop, Android WebView, Node.js). Features 100% offline local caching and tailored ergonomic layouts for Android touchscreens and Desktop keyboard workstations.

---

## Features

- **V8 Engine Optimizations**:
  - Zero-allocation Shunting-Yard parser compiling directly into Reverse Polish Notation (RPN).
  - Monomorphic Token structs tagged with Small Integers (Smis) for maximum Turbofan inline caching.
  - Zero `eval()` or dynamic Function compilation.
  - Achieves **156,000+ operations/second** on a single thread.
- **Precision Decimal Arithmetic**:
  - Custom BigInt-backed `Decimal` engine eliminating IEEE-754 floating-point inaccuracies (e.g. `0.1 + 0.2 === 0.3`, `1.4 - 1.2 === 0.2`).
- **100% Offline & Local-First**:
  - Service Worker (`sw.js`) with Cache-First strategy.
  - Web App Manifest (`manifest.json`) for standalone PWA installation on Android and Desktop.
  - Local persistence for calculation history and memory registers via `localStorage`.
- **Adaptive Layout Reflow**:
  - **Android Mobile (`<= 768px`)**: Dynamic `100dvh` viewport, thumb-zone ergonomics, touch targets $\ge 52\text{px}$, haptic vibration (`navigator.vibrate`), slide-up tape drawer, and collapsible scientific keypad.
  - **Desktop Workstation (`> 768px`)**: Side-by-side workstation with persistent calculation tape and simultaneously visible scientific and standard keypads. Full physical keyboard/numpad bindings.
  - **Mobile Landscape**: 2-column compact reflow.
- **Antislop Precision Design**:
  - Tactile instrument styling inspired by Dieter Rams / Braun ET66. High WCAG contrast, no generic glowing slop.

---

## Getting Started

Because the application uses ES Modules and a Service Worker, run it with a local HTTP server:

```bash
# Using Python 3:
python3 -m http.server 8080

# Or using Node.js:
npx serve .
```

Open `http://localhost:8080` in your browser.

---

## Testing & Benchmarks

Run the test suite and micro-benchmarks directly via Node.js:

```bash
# Run unit tests (22 test cases)
node tests/engine.test.js

# Run V8 throughput benchmark (250,000 operations)
node tests/benchmark.js
```

---

## License

MIT
