/**
 * Application Bootstrap & Controller
 * Glues V8 engine, UI managers, offline service worker, and layout state.
 */

import { CalculatorEngine, ANGLE_DEG, ANGLE_RAD } from './engine/index.js';
import { DisplayManager } from './ui/display.js';
import { HistoryManager } from './ui/history.js';
import { KeypadManager } from './ui/keypad.js';
import { KeyboardManager } from './ui/keyboard.js';

class CalculatorApp {
  constructor() {
    this.engine = new CalculatorEngine({ angleMode: ANGLE_DEG });
    this.expression = '';
    this.lastResult = '0';
    this.justCalculated = false;

    // DOM Elements
    this.exprDisplay = document.getElementById('calc-expr');
    this.valueDisplay = document.getElementById('calc-val');
    this.historyList = document.getElementById('history-list');
    this.keypadEl = document.getElementById('calc-keypad');
    this.angleToggleBtn = document.getElementById('btn-angle-toggle');
    this.sciDrawerBtn = document.getElementById('btn-sci-toggle');
    this.histDrawerBtn = document.getElementById('btn-history-toggle');
    this.historyClearBtn = document.getElementById('btn-clear-history');
    this.sciContainer = document.getElementById('scientific-keys');
    this.historyPanel = document.getElementById('history-panel');

    // UI Managers
    this.display = new DisplayManager(this.exprDisplay, this.valueDisplay);
    this.history = new HistoryManager((entry) => this.loadFromHistory(entry));
    this.keypad = new KeypadManager(this.keypadEl, (action, val) => this.handleAction(action, val));
    this.keyboard = new KeyboardManager((action, val) => this.handleAction(action, val));

    this.init();
  }

  init() {
    this.history.bindElement(this.historyList);
    this.display.setValue('0');
    this.display.setExpression('');

    this._bindControls();
    this._registerServiceWorker();
  }

  _bindControls() {
    // Angle mode toggle (DEG / RAD)
    if (this.angleToggleBtn) {
      this.angleToggleBtn.addEventListener('click', () => {
        const current = this.engine.getAngleMode();
        const next = current === ANGLE_DEG ? ANGLE_RAD : ANGLE_DEG;
        this.engine.setAngleMode(next);
        this.angleToggleBtn.textContent = next.toUpperCase();
        this.angleToggleBtn.setAttribute('aria-label', `Angle mode: ${next}`);
      });
    }

    // Mobile Scientific Drawer Toggle
    if (this.sciDrawerBtn && this.sciContainer) {
      this.sciDrawerBtn.addEventListener('click', () => {
        const isExpanded = this.sciContainer.classList.toggle('drawer-open');
        this.sciDrawerBtn.setAttribute('aria-expanded', String(isExpanded));
        this.sciDrawerBtn.classList.toggle('btn-active-toggle', isExpanded);
      });
    }

    // Mobile History Drawer Toggle
    if (this.histDrawerBtn && this.historyPanel) {
      this.histDrawerBtn.addEventListener('click', () => {
        const isOpen = this.historyPanel.classList.toggle('panel-open');
        this.histDrawerBtn.setAttribute('aria-expanded', String(isOpen));
        this.histDrawerBtn.classList.toggle('btn-active-toggle', isOpen);
      });
    }

    // Close History panel button (if present)
    const closeHistBtn = document.getElementById('btn-close-history');
    if (closeHistBtn && this.historyPanel) {
      closeHistBtn.addEventListener('click', () => {
        this.historyPanel.classList.remove('panel-open');
        if (this.histDrawerBtn) {
          this.histDrawerBtn.setAttribute('aria-expanded', 'false');
          this.histDrawerBtn.classList.remove('btn-active-toggle');
        }
      });
    }

    // Clear history
    if (this.historyClearBtn) {
      this.historyClearBtn.addEventListener('click', () => {
        this.history.clearHistory();
      });
    }
  }

  handleAction(action, val) {
    switch (action) {
      case 'digit':
        this.appendDigit(val);
        break;
      case 'decimal':
        this.appendDecimal();
        break;
      case 'operator':
        this.appendOperator(val);
        break;
      case 'func':
        this.appendFunction(val);
        break;
      case 'const':
        this.appendConstant(val);
        break;
      case 'paren':
        this.appendParen(val);
        break;
      case 'equals':
        this.executeCalculation();
        break;
      case 'clear':
        this.clearAll();
        break;
      case 'backspace':
        this.deleteLast();
        break;
      case 'mem-add':
        this.memoryAdd();
        break;
      case 'mem-sub':
        this.memorySub();
        break;
      case 'mem-recall':
        this.memoryRecall();
        break;
      case 'mem-clear':
        this.memoryClear();
        break;
      case 'negate':
        this.toggleSign();
        break;
      default:
        if (val) this.appendDigit(val);
        break;
    }
  }

  appendDigit(digit) {
    if (this.justCalculated) {
      this.expression = '';
      this.justCalculated = false;
    }
    this.expression += digit;
    this.display.setExpression(this.expression);
    this.display.setValue(this._getLastOperand() || digit);
  }

  appendDecimal() {
    if (this.justCalculated) {
      this.expression = '0';
      this.justCalculated = false;
    }
    const lastOp = this._getLastOperand();
    if (!lastOp || lastOp === '') {
      this.expression += '0.';
    } else if (!lastOp.includes('.')) {
      this.expression += '.';
    }
    this.display.setExpression(this.expression);
    this.display.setValue(this._getLastOperand() || '0');
  }

  appendOperator(op) {
    if (this.justCalculated) {
      this.expression = this.lastResult;
      this.justCalculated = false;
    }

    if (!this.expression && op === '-') {
      this.expression = '-';
      this.display.setExpression(this.expression);
      return;
    }

    if (!this.expression) return;

    // Replace trailing operator if user changed their mind
    const trimmed = this.expression.trimEnd();
    const lastChar = trimmed.slice(-1);
    if (['+', '-', '×', '÷', '*', '/', '^', '%'].includes(lastChar)) {
      this.expression = trimmed.slice(0, -1) + ' ' + op + ' ';
    } else {
      this.expression += ' ' + op + ' ';
    }

    this.display.setExpression(this.expression);
  }

  appendFunction(fn) {
    if (this.justCalculated) {
      this.expression = '';
      this.justCalculated = false;
    }
    this.expression += fn.endsWith('(') ? fn : fn + '(';
    this.display.setExpression(this.expression);
  }

  appendConstant(constant) {
    if (this.justCalculated) {
      this.expression = '';
      this.justCalculated = false;
    }
    this.expression += constant;
    this.display.setExpression(this.expression);
    this.display.setValue(constant);
  }

  appendParen(paren) {
    if (this.justCalculated) {
      this.justCalculated = false;
    }
    this.expression += paren;
    this.display.setExpression(this.expression);
  }

  toggleSign() {
    if (this.justCalculated) {
      this.expression = this.lastResult;
      this.justCalculated = false;
    }
    if (!this.expression) {
      this.expression = '-';
      this.display.setExpression(this.expression);
      return;
    }
    // Negate the last operand
    const match = this.expression.match(/([+-]?\d*\.?\d+)$/);
    if (match) {
      const num = match[1];
      const start = this.expression.slice(0, match.index);
      const replacement = num.startsWith('-') ? num.slice(1) : '-' + num;
      this.expression = start + replacement;
      this.display.setExpression(this.expression);
      this.display.setValue(replacement);
    }
  }

  executeCalculation() {
    if (!this.expression || !this.expression.trim()) return;

    try {
      const cleanExpr = this.expression.trim();
      const res = this.engine.calculate(cleanExpr);
      this.history.addEntry(cleanExpr, res);
      this.lastResult = res;
      this.justCalculated = true;
      this.display.setExpression(cleanExpr + ' =');
      this.display.setValue(res, false);
    } catch (err) {
      this.display.setValue(err.message || 'Error', true);
    }
  }

  clearAll() {
    this.expression = '';
    this.lastResult = '0';
    this.justCalculated = false;
    this.display.setExpression('');
    this.display.setValue('0', false);
  }

  deleteLast() {
    if (this.justCalculated) {
      this.clearAll();
      return;
    }
    if (this.expression.length > 0) {
      this.expression = this.expression.trimEnd();
      this.expression = this.expression.slice(0, -1).trimEnd();
      this.display.setExpression(this.expression);
      this.display.setValue(this._getLastOperand() || '0');
    }
  }

  memoryAdd() {
    const val = this._getCurrentNumber();
    const currentMem = this.history.getMemory();
    const sum = this.engine.calculate(`${currentMem} + ${val}`);
    this.history.setMemory(sum);
    this._flashIndicator('M+');
  }

  memorySub() {
    const val = this._getCurrentNumber();
    const currentMem = this.history.getMemory();
    const diff = this.engine.calculate(`${currentMem} - ${val}`);
    this.history.setMemory(diff);
    this._flashIndicator('M-');
  }

  memoryRecall() {
    const mem = this.history.getMemory();
    if (this.justCalculated) {
      this.expression = '';
      this.justCalculated = false;
    }
    this.expression += mem;
    this.display.setExpression(this.expression);
    this.display.setValue(mem);
  }

  memoryClear() {
    this.history.clearMemory();
    this._flashIndicator('MC');
  }

  loadFromHistory(entry) {
    this.expression = entry.result;
    this.lastResult = entry.result;
    this.justCalculated = true;
    this.display.setExpression(entry.expression + ' =');
    this.display.setValue(entry.result);
    // On mobile, close history drawer upon selection
    if (this.historyPanel) {
      this.historyPanel.classList.remove('panel-open');
    }
  }

  _getCurrentNumber() {
    return this.justCalculated ? this.lastResult : (this._getLastOperand() || '0');
  }

  _getLastOperand() {
    const tokens = this.expression.trim().split(/\s+/);
    return tokens[tokens.length - 1] || '';
  }

  _flashIndicator(msg) {
    const original = this.valueDisplay.textContent;
    this.valueDisplay.textContent = msg;
    setTimeout(() => {
      this.valueDisplay.textContent = original;
    }, 400);
  }

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => console.log('Service Worker registered for offline operation:', reg.scope))
          .catch((err) => console.warn('Service Worker registration failed:', err));
      });
    }
  }
}

// Bootstrap once DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CalculatorApp());
} else {
  new CalculatorApp();
}
