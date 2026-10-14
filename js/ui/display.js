/**
 * High-Performance Auto-Scaling Display
 * Uses direct textContent mutation and RAF batching to eliminate layout thrashing.
 */

export class DisplayManager {
  constructor(exprElement, valueElement) {
    this.exprElement = exprElement;
    this.valueElement = valueElement;
    this.currentExpr = '';
    this.currentValue = '0';
    this.isError = false;
    this.rafPending = false;
    this.currentFontClass = '';
  }

  setExpression(expr) {
    this.currentExpr = expr;
    this.requestRender();
  }

  setValue(val, isError = false) {
    this.currentValue = val;
    this.isError = isError;
    this.requestRender();
  }

  requestRender() {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this._render();
      this.rafPending = false;
    });
  }

  _render() {
    if (this.exprElement) {
      this.exprElement.textContent = this.currentExpr;
      this.exprElement.title = this.currentExpr;
      // Scroll expression to right so user always sees the latest entered token
      this.exprElement.scrollLeft = this.exprElement.scrollWidth;
    }

    if (this.valueElement) {
      this.valueElement.textContent = this.currentValue;
      if (this.isError) {
        this.valueElement.classList.add('display-error');
      } else {
        this.valueElement.classList.remove('display-error');
      }
      this._autoFitText();
    }
  }

  /**
   * Adjust font-size dynamically if number length exceeds container width
   */
  _autoFitText() {
    if (!this.valueElement) return;
    const len = this.currentValue.length;
    let targetClass = '';

    if (len > 18) {
      targetClass = 'font-xxs';
    } else if (len > 14) {
      targetClass = 'font-xs';
    } else if (len > 10) {
      targetClass = 'font-sm';
    }

    if (this.currentFontClass !== targetClass) {
      if (this.currentFontClass) {
        this.valueElement.classList.remove(this.currentFontClass);
      }
      if (targetClass) {
        this.valueElement.classList.add(targetClass);
      }
      this.currentFontClass = targetClass;
    }
  }
}
