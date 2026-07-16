// Pure CSS -> SCSS converter. Runs both in the browser bundle (via the
// __cssInspector namespace) and under node:test (via module.exports).
(() => {
  'use strict';

  const COLOR_TOKEN_RE = /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\([^)]*\)/g;

  // Colors are only worth extracting when they repeat across declarations.
  function collectRepeatedColors(declarations) {
    const counts = new Map(); // token -> count, insertion order = first seen
    for (const [, value] of declarations) {
      for (const token of value.match(COLOR_TOKEN_RE) || []) {
        counts.set(token, (counts.get(token) || 0) + 1);
      }
    }
    const vars = new Map(); // token -> variable name
    for (const [token, count] of counts) {
      if (count >= 2) vars.set(token, `$color-${vars.size + 1}`);
    }
    return vars;
  }

  function cssToScss(selector, declarations) {
    const vars = collectRepeatedColors(declarations);

    const body = declarations
      .map(([prop, value]) => {
        let v = value;
        for (const [token, name] of vars) v = v.split(token).join(name);
        return `  ${prop}: ${v};\n`;
      })
      .join('');

    let header = '';
    if (vars.size > 0) {
      header = [...vars].map(([token, name]) => `${name}: ${token};`).join('\n') + '\n\n';
    }

    return `${header}${selector} {\n${body}}\n`;
  }

  const api = { cssToScss };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign((globalThis.__cssInspector ||= {}), api);
})();
