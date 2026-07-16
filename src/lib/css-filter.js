// Pure filtering/formatting of computed styles: keeps only values that differ
// from the per-tag browser baseline, collapses longhands into shorthands and
// orders the result by relevance (layout -> box -> flex/grid -> type -> visual).
// Both inputs are plain {property: value} objects, so this runs under node:test.
(() => {
  'use strict';

  const SIDES = ['top', 'right', 'bottom', 'left'];
  const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

  // Ordered output spec. Strings are plain tracked properties; tagged entries
  // get special collapsing logic.
  const SPEC = [
    'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
    'float', 'clear', 'visibility',
    'box-sizing', 'width', 'min-width', 'max-width', 'height', 'min-height',
    'max-height',
    { type: 'box', prop: 'margin' },
    { type: 'box', prop: 'padding' },
    'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
    'align-content', 'align-self', 'order', 'flex-grow', 'flex-shrink',
    'flex-basis',
    { type: 'gap' },
    'grid-template-columns', 'grid-template-rows', 'grid-auto-flow',
    'color', 'font-family', 'font-size', 'font-weight', 'font-style',
    'line-height', 'letter-spacing', 'text-align', 'text-transform',
    'text-decoration-line', 'white-space', 'word-break', 'vertical-align',
    'background-color', 'background-image',
    { type: 'border' },
    { type: 'radius' },
    'box-shadow',
    { type: 'outline' },
    'opacity',
    { type: 'overflow' },
    'cursor', 'transform', 'pointer-events', 'user-select',
  ];

  // Every longhand the DOM layer must read from getComputedStyle.
  const TRACKED_PROPERTIES = [];
  for (const entry of SPEC) {
    if (typeof entry === 'string') TRACKED_PROPERTIES.push(entry);
    else if (entry.type === 'box') TRACKED_PROPERTIES.push(...SIDES.map((s) => `${entry.prop}-${s}`));
    else if (entry.type === 'gap') TRACKED_PROPERTIES.push('row-gap', 'column-gap');
    else if (entry.type === 'border') {
      for (const s of SIDES) TRACKED_PROPERTIES.push(`border-${s}-width`, `border-${s}-style`, `border-${s}-color`);
    } else if (entry.type === 'radius') TRACKED_PROPERTIES.push(...CORNERS.map((c) => `border-${c}-radius`));
    else if (entry.type === 'outline') TRACKED_PROPERTIES.push('outline-width', 'outline-style', 'outline-color');
    else if (entry.type === 'overflow') TRACKED_PROPERTIES.push('overflow-x', 'overflow-y');
  }

  function fourValue(t, r, b, l) {
    if (t === r && r === b && b === l) return t;
    if (t === b && r === l) return `${t} ${r}`;
    if (r === l) return `${t} ${r} ${b}`;
    return `${t} ${r} ${b} ${l}`;
  }

  function extractStyles(computed, baseline) {
    const changed = (p) => computed[p] != null && computed[p] !== baseline[p];
    const out = [];

    for (const entry of SPEC) {
      if (typeof entry === 'string') {
        if (changed(entry)) out.push([entry, computed[entry]]);
        continue;
      }

      if (entry.type === 'box') {
        const props = SIDES.map((s) => `${entry.prop}-${s}`);
        if (props.some(changed)) {
          out.push([entry.prop, fourValue(...props.map((p) => computed[p]))]);
        }
      } else if (entry.type === 'gap') {
        const row = changed('row-gap') ? computed['row-gap'] : null;
        const col = changed('column-gap') ? computed['column-gap'] : null;
        if (row !== null && col !== null) {
          out.push(['gap', row === col ? row : `${row} ${col}`]);
        } else if (row !== null) out.push(['row-gap', row]);
        else if (col !== null) out.push(['column-gap', col]);
      } else if (entry.type === 'border') {
        // A side counts as bordered once its style is not none; width/color
        // are then always reported (border-color defaults to currentColor,
        // which would otherwise be filtered out as "unchanged").
        const side = (s) => ({
          width: computed[`border-${s}-width`],
          style: computed[`border-${s}-style`],
          color: computed[`border-${s}-color`],
          bordered:
            computed[`border-${s}-style`] &&
            computed[`border-${s}-style`] !== 'none' &&
            computed[`border-${s}-width`] !== '0px',
          changed: [`border-${s}-width`, `border-${s}-style`, `border-${s}-color`].some(changed),
        });
        const sides = SIDES.map(side);
        const active = sides.filter((s) => s.bordered && s.changed);
        if (active.length > 0) {
          const [first] = sides;
          const uniform =
            sides.every((s) => s.bordered) &&
            sides.every((s) => s.width === first.width && s.style === first.style && s.color === first.color);
          if (uniform) {
            out.push(['border', `${first.width} ${first.style} ${first.color}`]);
          } else {
            SIDES.forEach((name, i) => {
              const s = sides[i];
              if (s.bordered && s.changed) out.push([`border-${name}`, `${s.width} ${s.style} ${s.color}`]);
            });
          }
        }
      } else if (entry.type === 'radius') {
        const props = CORNERS.map((c) => `border-${c}-radius`);
        if (props.some(changed)) {
          const value = fourValue(...props.map((p) => computed[p]));
          if (value !== '0px') out.push(['border-radius', value]);
        }
      } else if (entry.type === 'outline') {
        if (
          computed['outline-style'] &&
          computed['outline-style'] !== 'none' &&
          ['outline-width', 'outline-style', 'outline-color'].some(changed)
        ) {
          out.push(['outline', `${computed['outline-width']} ${computed['outline-style']} ${computed['outline-color']}`]);
        }
      } else if (entry.type === 'overflow') {
        const x = changed('overflow-x') ? computed['overflow-x'] : null;
        const y = changed('overflow-y') ? computed['overflow-y'] : null;
        if (x !== null && x === y) out.push(['overflow', x]);
        else {
          if (x !== null) out.push(['overflow-x', x]);
          if (y !== null) out.push(['overflow-y', y]);
        }
      }
    }

    return out;
  }

  const api = { extractStyles, TRACKED_PROPERTIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign((globalThis.__cssInspector ||= {}), api);
})();
