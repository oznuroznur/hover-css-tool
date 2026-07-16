// Entry point: wires messaging from the background script to the inspector
// and panel. Also exposes a test hook so the demo page can drive the flow
// without extension APIs.
(() => {
  'use strict';

  const NS = globalThis.__cssInspector;
  const panel = new NS.Panel();
  const inspector = new NS.Inspector({
    onSelect(el) {
      panel.show(NS.buildSelector(el), NS.collectStyles(el));
    },
  });
  inspector.onDisable = () => panel.hide();
  panel.onClose = () => inspector.disable();

  function toggle() {
    if (inspector.active) inspector.disable();
    else inspector.enable();
    return inspector.active;
  }

  NS.toggle = toggle;
  NS.inspector = inspector;
  NS.panel = panel;

  // `browser` on Firefox, `chrome` on Chromium — the APIs we use are
  // promise-based and name-compatible on both (see design doc).
  const ext = globalThis.browser ?? globalThis.chrome;
  if (ext?.runtime?.onMessage) {
    ext.runtime.onMessage.addListener((message) => {
      if (message?.type === 'css-inspector:toggle') {
        return Promise.resolve({ active: toggle() });
      }
    });
  }
})();
