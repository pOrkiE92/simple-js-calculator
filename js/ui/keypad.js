/**
 * Touch & Pointer Keypad Manager
 * Provides zero-latency key actuation, tactile pressed states, and Android haptics.
 */

export class KeypadManager {
  /**
   * @param {HTMLElement} keypadContainer 
   * @param {(action: string, value: string) => void} onKeyPress 
   */
  constructor(keypadContainer, onKeyPress) {
    this.container = keypadContainer;
    this.onKeyPress = onKeyPress;
    this._bindEvents();
  }

  _bindEvents() {
    if (!this.container) return;

    // Use PointerEvents to support touch, pen, and mouse uniformly
    this.container.addEventListener('pointerdown', (e) => {
      const button = e.target.closest('button[data-action], button[data-val]');
      if (!button) return;

      // Haptic feedback for mobile devices (e.g. Android Chrome)
      if (typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(10);
        } catch {
          // Ignore if vibration permissions are disabled
        }
      }

      button.classList.add('key-active');

      const action = button.dataset.action || '';
      const val = button.dataset.val || button.textContent.trim();

      if (typeof this.onKeyPress === 'function') {
        this.onKeyPress(action, val);
      }
    }, { passive: true });

    // Release active visual state on pointerup or cancel anywhere on the screen
    const releaseKeys = () => {
      const activeBtns = this.container.querySelectorAll('.key-active');
      activeBtns.forEach((btn) => btn.classList.remove('key-active'));
    };

    window.addEventListener('pointerup', releaseKeys, { passive: true });
    window.addEventListener('pointercancel', releaseKeys, { passive: true });
    this.container.addEventListener('pointerleave', releaseKeys, { passive: true });
  }
}
