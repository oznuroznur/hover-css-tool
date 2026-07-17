// Overlay panel rendered inside a closed shadow root so the visited page's
// CSS cannot restyle it. Shows CSS / SCSS / Tailwind tabs with copy buttons.
(() => {
  'use strict';

  const NS = (globalThis.__cssInspector ||= {});

  const PANEL_CSS = `
    :host { all: initial; }
    .panel {
      position: fixed; right: 16px; bottom: 16px; width: 380px;
      max-height: min(70vh, 560px); display: flex; flex-direction: column;
      background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a;
      border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,.45);
      font: 12px/1.5 ui-monospace, Consolas, monospace; z-index: 2147483647;
      overflow: hidden;
    }
    .head {
      display: flex; align-items: center; gap: 8px; padding: 8px 10px;
      background: #181825; border-bottom: 1px solid #45475a;
    }
    .selector {
      flex: 1; color: #89b4fa; white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; font-weight: bold;
    }
    .close {
      background: none; border: none; color: #a6adc8; cursor: pointer;
      font: inherit; font-size: 14px; padding: 0 4px;
    }
    .close:hover { color: #f38ba8; }
    .tabs { display: flex; gap: 4px; padding: 8px 10px 0; }
    .tab {
      background: #313244; border: 1px solid #45475a; border-bottom: none;
      color: #a6adc8; cursor: pointer; font: inherit; padding: 4px 12px;
      border-radius: 6px 6px 0 0;
    }
    .tab[aria-selected="true"] { background: #11111b; color: #89b4fa; }
    .body {
      margin: 0 10px 0; background: #11111b; border: 1px solid #45475a;
      border-radius: 0 6px 6px 6px; overflow: auto; flex: 1; min-height: 80px;
    }
    pre { margin: 0; padding: 10px; white-space: pre; }
    pre.wrap { white-space: pre-wrap; word-break: break-word; }
    .foot { display: flex; justify-content: flex-end; padding: 8px 10px; }
    .copy {
      background: #89b4fa; border: none; border-radius: 6px; color: #11111b;
      cursor: pointer; font: inherit; font-weight: bold; padding: 5px 14px;
    }
    .copy:hover { background: #b4befe; }
    .copy.done { background: #a6e3a1; }
  `;

  function renderCss(selector, declarations) {
    const body = declarations.map(([p, v]) => `  ${p}: ${v};`).join('\n');
    return `${selector} {\n${body}\n}\n`;
  }

  function renderTailwind(declarations) {
    const { classes, unmapped } = NS.cssToTailwind(declarations);
    let out = classes.join(' ') + '\n';
    if (unmapped.length > 0) {
      out += '\n/* not mapped:\n';
      out += unmapped.map(([p, v]) => `   ${p}: ${v};`).join('\n');
      out += '\n*/\n';
    }
    return out;
  }

  class Panel {
    constructor() {
      this.host = document.createElement('div');
      this.host.id = NS.HOST_ID;
      this.shadow = this.host.attachShadow({ mode: 'closed' });
      this.activeTab = 'css';
      this.code = { css: '', scss: '', tailwind: '' };

      const style = document.createElement('style');
      style.textContent = PANEL_CSS;
      this.shadow.appendChild(style);

      this.root = document.createElement('div');
      this.root.className = 'panel';
      this.root.innerHTML = `
        <div class="head">
          <span class="selector"></span>
          <button class="close" title="Close (Esc)">✕</button>
        </div>
        <div class="tabs" role="tablist">
          <button class="tab" role="tab" data-tab="css">CSS</button>
          <button class="tab" role="tab" data-tab="scss">SCSS</button>
          <button class="tab" role="tab" data-tab="tailwind">Tailwind</button>
        </div>
        <div class="body"><pre><code></code></pre></div>
        <div class="foot"><button class="copy">Copy</button></div>
      `;
      this.shadow.appendChild(this.root);

      this.root.querySelector('.close').addEventListener('click', () => {
        this.hide();
        if (this.onClose) this.onClose();
      });
      for (const tab of this.root.querySelectorAll('.tab')) {
        tab.addEventListener('click', () => this.setTab(tab.dataset.tab));
      }
      this.copyBtn = this.root.querySelector('.copy');
      this.copyBtn.addEventListener('click', () => this.copy());
    }

    show(selector, declarations) {
      this.code = {
        css: renderCss(selector, declarations),
        scss: NS.cssToScss(selector, declarations),
        tailwind: renderTailwind(declarations),
      };
      this.root.querySelector('.selector').textContent = selector;
      if (!this.host.isConnected) document.documentElement.appendChild(this.host);
      this.setTab(this.activeTab);
    }

    setTab(name) {
      this.activeTab = name;
      for (const tab of this.root.querySelectorAll('.tab')) {
        tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
      }
      this.root.querySelector('code').textContent = this.code[name];
      this.root.querySelector('pre').classList.toggle('wrap', name === 'tailwind');
      this.copyBtn.textContent = 'Copy';
      this.copyBtn.classList.remove('done');
    }

    async copy() {
      const text = this.code[this.activeTab];
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        // Clipboard API can be unavailable on plain-http pages; fall back.
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        try {
          ok = document.execCommand('copy');
        } finally {
          ta.remove();
        }
      }
      this.copyBtn.textContent = ok ? 'Copied ✓' : 'Copy failed';
      this.copyBtn.classList.toggle('done', ok);
    }

    hide() {
      if (this.host.isConnected) this.host.remove();
    }
  }

  Object.assign(NS, { Panel });
})();
