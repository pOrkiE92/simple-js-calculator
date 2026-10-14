/**
 * Desktop Physical Keyboard Controller
 * Maps Numpad, functional keys, and scientific shortcuts to calculator actions.
 */

export class KeyboardManager {
  /**
   * @param {(action: string, value: string) => void} onKeyPress 
   */
  constructor(onKeyPress) {
    this.onKeyPress = onKeyPress;
    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing in an input field (e.g. search)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key;
      let handled = false;

      // Digits 0-9
      if (key >= '0' && key <= '9') {
        this.emit('digit', key);
        handled = true;
      } else if (key === '.') {
        this.emit('decimal', '.');
        handled = true;
      } else if (key === '+' || key === '-') {
        this.emit('operator', key);
        handled = true;
      } else if (key === '*' || key === 'x' || key === 'X') {
        this.emit('operator', '×');
        handled = true;
      } else if (key === '/') {
        this.emit('operator', '÷');
        handled = true;
      } else if (key === '%' || key === '^') {
        this.emit('operator', key);
        handled = true;
      } else if (key === '(' || key === ')') {
        this.emit('paren', key);
        handled = true;
      } else if (key === 'Enter' || key === '=') {
        this.emit('equals', '=');
        handled = true;
      } else if (key === 'Backspace') {
        this.emit('backspace', '⌫');
        handled = true;
      } else if (key === 'Escape' || key === 'Delete') {
        this.emit('clear', 'C');
        handled = true;
      } else if (key === '!') {
        this.emit('func', 'fact(');
        handled = true;
      } else if (key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        this.emit('func', 'sin(');
        handled = true;
      } else if (key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        this.emit('func', 'cos(');
        handled = true;
      } else if (key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        this.emit('func', 'tan(');
        handled = true;
      } else if (key.toLowerCase() === 'q' && !e.ctrlKey && !e.metaKey) {
        this.emit('func', 'sqrt(');
        handled = true;
      } else if (key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey) {
        this.emit('func', 'ln(');
        handled = true;
      } else if (key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
        this.emit('const', 'π');
        handled = true;
      } else if (key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
        this.emit('const', 'e');
        handled = true;
      }

      if (handled) {
        e.preventDefault();
      }
    });
  }

  emit(action, value) {
    if (typeof this.onKeyPress === 'function') {
      this.onKeyPress(action, value);
    }
  }
}
