// Toolbar click -> toggle inspect mode in the active tab. The content script
// is injected on demand (activeTab), so no host permissions are needed.
// `browser` on Firefox, `chrome` on Chromium; both are promise-based here.
const ext = globalThis.browser ?? globalThis.chrome;

ext.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await ext.tabs.sendMessage(tab.id, { type: 'css-inspector:toggle' });
  } catch {
    // Not injected yet on this page — inject, then toggle on.
    await ext.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
    await ext.tabs.sendMessage(tab.id, { type: 'css-inspector:toggle' });
  }
});
