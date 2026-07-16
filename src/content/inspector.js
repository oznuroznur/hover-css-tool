// DOM layer: baseline collection, style snapshotting, hover highlight and
// click-to-select. Depends on css-filter.js being loaded into __cssInspector.
(() => {
  'use strict';

  const NS = (globalThis.__cssInspector ||= {});
  const HOST_ID = 'css-inspector-host';

  let baselineFrame = null;
  const baselineCache = new Map(); // tagName -> {prop: value}

  function snapshot(style) {
    const out = {};
    for (const prop of NS.TRACKED_PROPERTIES) out[prop] = style.getPropertyValue(prop);
    return out;
  }

  // Browser-default styles for a tag, measured in a blank iframe so the page's
  // own stylesheets cannot leak in. Falls back to `all: revert` inside the
  // page when the iframe document is inaccessible (e.g. exotic CSP setups).
  function getBaseline(tagName) {
    const tag = tagName.toLowerCase();
    if (baselineCache.has(tag)) return baselineCache.get(tag);

    let result = null;
    try {
      if (!baselineFrame || !baselineFrame.contentDocument) {
        baselineFrame = document.createElement('iframe');
        baselineFrame.style.cssText =
          'position:absolute;width:0;height:0;border:0;visibility:hidden;';
        baselineFrame.setAttribute('aria-hidden', 'true');
        document.documentElement.appendChild(baselineFrame);
      }
      const doc = baselineFrame.contentDocument;
      if (doc) {
        const probe = doc.createElement(tag);
        doc.body.appendChild(probe);
        result = snapshot(baselineFrame.contentWindow.getComputedStyle(probe));
        probe.remove();
      }
    } catch {
      result = null;
    }

    if (!result) {
      const container = document.createElement('div');
      container.style.cssText =
        'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;';
      const probe = document.createElement(tag);
      probe.style.cssText = 'all: revert;';
      container.appendChild(probe);
      document.documentElement.appendChild(container);
      result = snapshot(getComputedStyle(probe));
      container.remove();
    }

    baselineCache.set(tag, result);
    return result;
  }

  // Geometry values resolve to pixels even when the page never set them
  // (an auto-sized button still "computes" a width). Only report these when
  // some accessible stylesheet or inline style actually declares them.
  const GEOMETRY = {
    width: ['width'], height: ['height'],
    'min-width': ['min-width'], 'max-width': ['max-width'],
    'min-height': ['min-height'], 'max-height': ['max-height'],
    top: ['top', 'inset'], right: ['right', 'inset'],
    bottom: ['bottom', 'inset'], left: ['left', 'inset'],
  };

  function collectAuthored(rules, el, props) {
    for (const rule of rules) {
      if (rule.selectorText && rule.style) {
        try {
          if (el.matches(rule.selectorText)) {
            for (let i = 0; i < rule.style.length; i++) props.add(rule.style[i]);
          }
        } catch {
          // unsupported selector — ignore
        }
      }
      // @media/@supports blocks, and nested rules inside style rules
      if (rule.cssRules && rule.cssRules.length > 0) collectAuthored(rule.cssRules, el, props);
    }
  }

  // Set of property names the page's own CSS declares for this element,
  // or null when unknowable (cross-origin stylesheet).
  function authoredProperties(el) {
    const props = new Set();
    for (let i = 0; i < el.style.length; i++) props.add(el.style[i]);
    try {
      for (const sheet of document.styleSheets) collectAuthored(sheet.cssRules, el, props);
    } catch {
      return null;
    }
    return props;
  }

  function collectStyles(el) {
    let pairs = NS.extractStyles(snapshot(getComputedStyle(el)), getBaseline(el.tagName));
    const authored = authoredProperties(el);
    if (authored) {
      pairs = pairs.filter(([prop]) => {
        const sources = GEOMETRY[prop];
        return !sources || sources.some((s) => authored.has(s));
      });
    }
    return pairs;
  }

  function buildSelector(el) {
    const tag = el.tagName.toLowerCase();
    if (el.id) return `${tag}#${el.id}`;
    const classes = [...el.classList]
      .filter((c) => /^[a-zA-Z_-][\w-]*$/.test(c))
      .slice(0, 3);
    return classes.length ? `${tag}.${classes.join('.')}` : tag;
  }

  class Inspector {
    constructor({ onSelect }) {
      this.onSelect = onSelect;
      this.active = false;
      this.target = null;
      this.overlay = null;
      this.label = null;
      this.onMouseMove = this.handleMouseMove.bind(this);
      this.onClick = this.handleClick.bind(this);
      this.onKeyDown = this.handleKeyDown.bind(this);
      this.onScroll = this.handleScroll.bind(this);
    }

    enable() {
      if (this.active) return;
      this.active = true;
      this.ensureOverlay();
      document.addEventListener('mousemove', this.onMouseMove, true);
      document.addEventListener('click', this.onClick, true);
      document.addEventListener('keydown', this.onKeyDown, true);
      window.addEventListener('scroll', this.onScroll, true);
    }

    disable() {
      if (!this.active) return;
      this.active = false;
      this.target = null;
      document.removeEventListener('mousemove', this.onMouseMove, true);
      document.removeEventListener('click', this.onClick, true);
      document.removeEventListener('keydown', this.onKeyDown, true);
      window.removeEventListener('scroll', this.onScroll, true);
      this.hideOverlay();
      if (this.onDisable) this.onDisable();
    }

    ensureOverlay() {
      if (this.overlay) return;
      this.overlay = document.createElement('div');
      this.overlay.style.cssText =
        'position:fixed;display:none;pointer-events:none;z-index:2147483646;' +
        'border:2px solid #3b82f6;background:rgba(59,130,246,0.08);' +
        'box-sizing:border-box;border-radius:2px;';
      this.label = document.createElement('div');
      this.label.style.cssText =
        'position:absolute;left:-2px;top:-24px;padding:2px 6px;' +
        'background:#3b82f6;color:#fff;font:11px/16px monospace;' +
        'border-radius:3px;white-space:nowrap;';
      this.overlay.appendChild(this.label);
      document.documentElement.appendChild(this.overlay);
    }

    hideOverlay() {
      if (this.overlay) this.overlay.style.display = 'none';
    }

    isOwnUi(eventTarget) {
      const node = eventTarget instanceof Element ? eventTarget : null;
      return !!node && (node.id === HOST_ID || !!node.closest(`#${HOST_ID}`));
    }

    pickTarget(event) {
      const path = event.composedPath();
      const el = path.find((n) => n instanceof Element && n !== this.overlay && n !== this.label);
      if (!el || this.isOwnUi(el)) return null;
      if (el === document.documentElement || el === document.body) return null;
      return el;
    }

    handleMouseMove(event) {
      const el = this.pickTarget(event);
      if (!el) {
        this.target = null;
        this.hideOverlay();
        return;
      }
      if (el !== this.target) {
        this.target = el;
        this.positionOverlay(el);
      }
    }

    positionOverlay(el) {
      const rect = el.getBoundingClientRect();
      Object.assign(this.overlay.style, {
        display: 'block',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
      this.label.textContent = buildSelector(el);
      this.label.style.top = rect.top < 28 ? `${rect.height + 2}px` : '-24px';
    }

    handleScroll() {
      if (this.target) this.positionOverlay(this.target);
    }

    handleClick(event) {
      if (this.isOwnUi(event.composedPath()[0])) return; // let panel clicks through
      const el = this.pickTarget(event);
      if (!el) return;
      event.preventDefault();
      event.stopPropagation();
      this.onSelect(el);
    }

    handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.disable();
      }
    }
  }

  Object.assign(NS, { Inspector, collectStyles, buildSelector, HOST_ID });
})();
