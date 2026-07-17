# CSS Inspector

A browser extension that highlights any element on a page as you hover,
lets you select it with a click, and shows its styles in three copyable
formats — **CSS**, **SCSS** and **Tailwind**. Works on Chrome and Firefox
(Manifest V3).

## Usage

1. Click the extension icon → inspect mode turns on.
2. Move around the page: the hovered element is highlighted with a blue
   outline (labeled with its tag + class).
3. Click an element → a panel opens in the bottom-right corner; pick the
   CSS / SCSS / Tailwind tab and hit **Copy** to put it on your clipboard.
4. Click another element to switch the selection. Exit with **Esc** or by
   clicking the icon again.

## Setup (development)

```bash
npm run build   # produces the dist/chrome and dist/firefox packages
npm test        # unit tests for the pure conversion functions
```

**Chrome:** `chrome://extensions` → enable "Developer mode" → "Load
unpacked" → select the `dist/chrome` folder.

**Firefox:** `about:debugging#/runtime/this-firefox` → "Load Temporary
Add-on" → select `dist/firefox/manifest.json`. (Temporary add-ons are
removed when Firefox closes; reload them each session.)

## How it works

- When the icon is clicked, the background script injects the content
  script **into that tab only** (`activeTab` + `scripting`) — the extension
  never asks for persistent access to any site.
- The element's `getComputedStyle` output is compared against the browser
  default for the same tag rendered in an empty iframe; only properties
  that **differ from the default** are shown. Longhands are collapsed into
  shorthands for readability (`margin`, `padding`, `border`,
  `border-radius`, `gap`).
- Geometry values such as `width`/`height` are only shown when the page's
  CSS actually declares them (the resolved pixel size of an auto-sized
  element is noise, not styling).
- The panel is rendered inside a **Shadow DOM** so the visited page's CSS
  cannot break it.

## Limitations

- **The Tailwind conversion is approximate — 100% accuracy is not
  promised.** Values that sit on the standard Tailwind scale become utility
  classes (`16px` → `p-4`); everything else falls back to arbitrary values
  (`13px` → `p-[13px]`, colors as `text-[#3b82f6]`). Properties that cannot
  be mapped are listed in a comment block below the output.
- Values are **computed (used) values**: `em`/`rem`/`%` arrive resolved to
  pixels, color names as `rgb()`. Display scaling (e.g. Windows 125%) can
  make a `1px` border report as `0.8px` — that is the real used value the
  browser reports.
- On pages with cross-origin stylesheets the geometry filter is disabled
  (what the page declares cannot be read, so everything is shown).
- Pseudo-elements (`::before` etc.) and hover/focus state styles are out of
  scope for v1.

## Store publishing (Chrome Web Store / Firefox AMO)

Publishing materials are ready:

- **Icons:** `assets/icons/` (16/48/128 PNG) — referenced by the manifests
  and copied into `dist/*/icons/` by the build.
- **Screenshots:** `assets/store/` (4 files, 1280x800 PNG) — caption
  suggestions live in `store/listing.md`.
- **Listing copy:** `store/listing.md` (short/full description in Turkish
  and English, category suggestions, permission justifications).
- **Privacy policy:** `PRIVACY.md` — once the repo is pushed to GitHub, the
  file's GitHub URL can be used in the "privacy policy URL" field of both
  stores.

### The AMO "do you need to submit source code?" question

Firefox AMO requires separate source-code submission when the packaged code
is minified or transpiled. **That is not needed here**: `build.js` only
concatenates the files under `src/` as-is — no minification, transpilation
or bundler. The code inside `dist/firefox/content.js` is line-for-line
identical to the source and fully readable. Answer **"No"** on the
submission form. If a reviewer still asks, provide the GitHub repo link;
`npm run build` (requires only Node, zero dependencies) reproduces the
package exactly.

## Chrome ↔ Firefox differences (developer notes)

A single codebase is packaged with two manifests (`build.js`):

| | Chrome | Firefox |
|---|---|---|
| Background | `service_worker` | `scripts` (event page — FF doesn't support service workers) |
| Identity | — | `browser_specific_settings.gecko.id` required |
| Data declaration | — | `data_collection_permissions` (FF 140+; older versions ignore it) |

The APIs used (`action`, `scripting`, `tabs.sendMessage`,
`runtime.onMessage`) are promise-based and name-compatible in both
browsers, so a three-line `globalThis.browser ?? globalThis.chrome` shim
replaces `webextension-polyfill` (rationale:
`docs/superpowers/specs/2026-07-16-css-inspector-design.md`).

`dist/firefox` passes `web-ext lint` with 0 errors. Manual checklist for a
real Firefox run: toggle via icon, hover highlight, contents of all three
tabs, copy, exit with Esc.

## Project structure

```
src/lib/         pure, testable conversion functions
  css-filter.js        baseline diff + shorthand collapsing + priority order
  css-to-scss.js       SCSS + extracting repeated colors into $variables
  css-to-tailwind.js   Tailwind mapping + arbitrary-value fallback
src/content/     inspector (hover/select), panel (Shadow DOM UI), entry point
src/background.js, src/manifest.{chrome,firefox}.json
build.js         zero-dependency build → dist/chrome, dist/firefox
test/            node:test unit tests
demo/demo.html   test page with a button + card + flex container
assets/icons/    extension icons (16/48/128)
assets/store/    store screenshots (1280x800)
store/listing.md store listing copy (TR/EN)
PRIVACY.md       privacy policy (URL source for the store forms)
```
