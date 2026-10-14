/**
 * Offline Calculation Tape & Memory Manager
 * Persists calculation audit history and memory registers to localStorage.
 */

const STORAGE_KEY_HISTORY = 'v8_calc_history_v1';
const STORAGE_KEY_MEMORY = 'v8_calc_memory_v1';
const MAX_HISTORY_ITEMS = 50;

export class HistoryManager {
  constructor(onSelectEntry) {
    this.onSelectEntry = onSelectEntry;
    this.history = this._loadHistory();
    this.memory = this._loadMemory();
    this.listElement = null;
  }

  bindElement(element) {
    this.listElement = element;
    this.render();
  }

  _loadHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  _saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.history));
    } catch (e) {
      console.warn('Failed to save calculation history to localStorage', e);
    }
  }

  _loadMemory() {
    try {
      const val = localStorage.getItem(STORAGE_KEY_MEMORY);
      return val ? val : '0';
    } catch {
      return '0';
    }
  }

  _saveMemory() {
    try {
      localStorage.setItem(STORAGE_KEY_MEMORY, this.memory);
    } catch (e) {
      console.warn('Failed to save memory register', e);
    }
  }

  addEntry(expression, result) {
    if (!expression || !result) return;
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      expression,
      result,
      timestamp: Date.now()
    };
    this.history.unshift(entry);
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history.pop();
    }
    this._saveHistory();

    if (this.listElement) {
      const emptyEl = this.listElement.querySelector('.history-empty');
      if (emptyEl) {
        this.listElement.innerHTML = '';
      }
      const itemEl = this._createItemElement(entry);
      this.listElement.prepend(itemEl);
      if (this.listElement.children.length > MAX_HISTORY_ITEMS) {
        this.listElement.lastElementChild?.remove();
      }
    }
  }

  clearHistory() {
    this.history = [];
    this._saveHistory();
    this.render();
  }

  // Memory Registers
  getMemory() {
    return this.memory;
  }

  setMemory(val) {
    this.memory = String(val);
    this._saveMemory();
  }

  clearMemory() {
    this.memory = '0';
    this._saveMemory();
  }

  _createItemElement(item) {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${item.expression} equals ${item.result}`);

    el.innerHTML = `
      <div class="history-expr">${escapeHTML(item.expression)}</div>
      <div class="history-res">= ${escapeHTML(item.result)}</div>
    `;

    el.addEventListener('click', () => {
      if (typeof this.onSelectEntry === 'function') {
        this.onSelectEntry(item);
      }
    });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (typeof this.onSelectEntry === 'function') {
          this.onSelectEntry(item);
        }
      }
    });

    return el;
  }

  render() {
    if (!this.listElement) return;

    if (this.history.length === 0) {
      this.listElement.innerHTML = `
        <div class="history-empty">
          <p>No calculations yet</p>
          <span class="history-empty-hint">Calculations will appear here</span>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    this.history.forEach((item) => {
      fragment.appendChild(this._createItemElement(item));
    });

    this.listElement.innerHTML = '';
    this.listElement.appendChild(fragment);
  }
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
