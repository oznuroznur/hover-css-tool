// Pure CSS -> Tailwind converter. The mapping is intentionally approximate:
// values that do not sit on Tailwind's standard scales fall back to
// arbitrary-value syntax (e.g. p-[13px]). See README for limitations.
(() => {
  'use strict';

  // px -> Tailwind spacing token (p-4 means 16px, etc.)
  const SPACING = {
    0: '0', 1: 'px', 2: '0.5', 4: '1', 6: '1.5', 8: '2', 10: '2.5', 12: '3',
    14: '3.5', 16: '4', 20: '5', 24: '6', 28: '7', 32: '8', 36: '9', 40: '10',
    44: '11', 48: '12', 56: '14', 64: '16', 80: '20', 96: '24', 112: '28',
    128: '32', 144: '36', 160: '40', 176: '44', 192: '48', 208: '52',
    224: '56', 240: '60', 256: '64', 288: '72', 320: '80', 384: '96',
  };

  const FONT_SIZE = {
    12: 'text-xs', 14: 'text-sm', 16: 'text-base', 18: 'text-lg', 20: 'text-xl',
    24: 'text-2xl', 30: 'text-3xl', 36: 'text-4xl', 48: 'text-5xl',
    60: 'text-6xl', 72: 'text-7xl', 96: 'text-8xl', 128: 'text-9xl',
  };

  const FONT_WEIGHT = {
    100: 'font-thin', 200: 'font-extralight', 300: 'font-light',
    400: 'font-normal', 500: 'font-medium', 600: 'font-semibold',
    700: 'font-bold', 800: 'font-extrabold', 900: 'font-black',
  };

  const LINE_HEIGHT_PX = {
    12: 'leading-3', 16: 'leading-4', 20: 'leading-5', 24: 'leading-6',
    28: 'leading-7', 32: 'leading-8', 36: 'leading-9', 40: 'leading-10',
  };

  const RADIUS = {
    2: 'rounded-sm', 4: 'rounded', 6: 'rounded-md', 8: 'rounded-lg',
    12: 'rounded-xl', 16: 'rounded-2xl', 24: 'rounded-3xl',
  };

  const DISPLAY = {
    block: 'block', 'inline-block': 'inline-block', inline: 'inline',
    flex: 'flex', 'inline-flex': 'inline-flex', grid: 'grid',
    'inline-grid': 'inline-grid', table: 'table', 'inline-table': 'inline-table',
    'flow-root': 'flow-root', contents: 'contents', 'list-item': 'list-item',
    none: 'hidden',
  };

  const JUSTIFY = {
    'flex-start': 'justify-start', start: 'justify-start', center: 'justify-center',
    'flex-end': 'justify-end', end: 'justify-end', 'space-between': 'justify-between',
    'space-around': 'justify-around', 'space-evenly': 'justify-evenly',
  };

  const ALIGN_ITEMS = {
    'flex-start': 'items-start', start: 'items-start', center: 'items-center',
    'flex-end': 'items-end', end: 'items-end', stretch: 'items-stretch',
    baseline: 'items-baseline',
  };

  const FLEX_DIRECTION = {
    row: 'flex-row', 'row-reverse': 'flex-row-reverse',
    column: 'flex-col', 'column-reverse': 'flex-col-reverse',
  };

  function parsePx(value) {
    const m = /^(-?\d*\.?\d+)px$/.exec(value);
    return m ? parseFloat(m[1]) : null;
  }

  // rgb()/rgba() -> #hex when opaque; otherwise a space-free functional value.
  function normalizeColor(value) {
    const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(value);
    if (m) {
      const alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
      if (alpha === 1) {
        const hex = [m[1], m[2], m[3]]
          .map((n) => parseInt(n, 10).toString(16).padStart(2, '0'))
          .join('');
        return `#${hex}`;
      }
    }
    return value.replace(/\s+/g, '');
  }

  function stripSpaces(value) {
    return value.replace(/,\s+/g, ',').replace(/\s+/g, '_');
  }

  // One spacing-ish value -> class, e.g. ('p', '16px') -> 'p-4'.
  function spacingClass(prefix, value) {
    if (value === 'auto') return `${prefix}-auto`;
    const px = parsePx(value);
    if (px === null) return `${prefix}-[${value.replace(/\s+/g, '_')}]`;
    const negative = px < 0;
    const token = SPACING[Math.abs(px)];
    if (token === undefined) {
      return negative ? `-${prefix}-[${Math.abs(px)}px]` : `${prefix}-[${value}]`;
    }
    return `${negative ? '-' : ''}${prefix}-${token}`;
  }

  // padding/margin shorthand (1-4 values) -> p/px/py/pt... classes.
  function boxClasses(prefix, value) {
    const parts = value.trim().split(/\s+/);
    let [t, r, b, l] = [parts[0], parts[1], parts[2], parts[3]];
    if (parts.length === 1) [r, b, l] = [t, t, t];
    else if (parts.length === 2) [b, l] = [t, r];
    else if (parts.length === 3) [l] = [r];
    if (t === b && r === l) {
      if (t === r) return [spacingClass(prefix, t)];
      return [spacingClass(`${prefix}y`, t), spacingClass(`${prefix}x`, r)];
    }
    return [
      spacingClass(`${prefix}t`, t),
      spacingClass(`${prefix}r`, r),
      spacingClass(`${prefix}b`, b),
      spacingClass(`${prefix}l`, l),
    ];
  }

  function sizeClass(prefix, value, axis) {
    if (value === 'auto') return `${prefix}-auto`;
    if (value === '100%') return `${prefix}-full`;
    if (value === '50%') return `${prefix}-1/2`;
    if (value === '25%') return `${prefix}-1/4`;
    if (value === '75%') return `${prefix}-3/4`;
    if (axis === 'x' && value === '100vw') return `${prefix}-screen`;
    if (axis === 'y' && value === '100vh') return `${prefix}-screen`;
    const px = parsePx(value);
    if (px !== null && SPACING[px] !== undefined) return `${prefix}-${SPACING[px]}`;
    return `${prefix}-[${value.replace(/\s+/g, '_')}]`;
  }

  function borderClasses(value) {
    const out = [];
    // Computed shorthand shape: <width> <style> <color>
    const m = /^(\d*\.?\d+px)\s+(\w+)\s+(.+)$/.exec(value.trim());
    if (!m) return null;
    const [, widthPx, style, color] = m;
    const width = parsePx(widthPx);
    if (style === 'none' || width === 0) return ['border-none'];
    if (width === 1) out.push('border');
    else if ([2, 4, 8].includes(width)) out.push(`border-${width}`);
    else out.push(`border-[${width}px]`);
    if (style !== 'solid') out.push(`border-${style}`);
    out.push(`border-[${normalizeColor(color)}]`);
    return out;
  }

  function radiusClasses(value) {
    const parts = value.trim().split(/\s+/);
    if (parts.length === 1) {
      if (value === '50%' || (parsePx(value) ?? 0) >= 9999) return ['rounded-full'];
      const px = parsePx(value);
      if (px === 0) return [];
      if (px !== null && RADIUS[px]) return [RADIUS[px]];
      return [`rounded-[${value.replace(/\s+/g, '_')}]`];
    }
    return [`rounded-[${value.replace(/\s+/g, '_')}]`];
  }

  function lineHeightClass(value) {
    const px = parsePx(value);
    if (px !== null) return LINE_HEIGHT_PX[px] || `leading-[${value}]`;
    const unitless = { 1: 'leading-none', 1.25: 'leading-tight', 1.375: 'leading-snug', 1.5: 'leading-normal', 1.625: 'leading-relaxed', 2: 'leading-loose' };
    return unitless[parseFloat(value)] || `leading-[${value.replace(/\s+/g, '_')}]`;
  }

  const KEYWORD_PROPS = {
    position: (v) => (['static', 'relative', 'absolute', 'fixed', 'sticky'].includes(v) ? [v] : null),
    display: (v) => (DISPLAY[v] ? [DISPLAY[v]] : null),
    'flex-direction': (v) => (FLEX_DIRECTION[v] ? [FLEX_DIRECTION[v]] : null),
    'justify-content': (v) => (JUSTIFY[v] ? [JUSTIFY[v]] : null),
    'align-items': (v) => (ALIGN_ITEMS[v] ? [ALIGN_ITEMS[v]] : null),
    'flex-wrap': (v) => ({ wrap: ['flex-wrap'], 'wrap-reverse': ['flex-wrap-reverse'], nowrap: ['flex-nowrap'] }[v] || null),
    'text-align': (v) => (['left', 'center', 'right', 'justify'].includes(v) ? [`text-${v}`] : null),
    'text-transform': (v) => (v === 'none' ? [] : ['uppercase', 'lowercase', 'capitalize'].includes(v) ? [v] : null),
    'font-style': (v) => (v === 'italic' ? ['italic'] : v === 'normal' ? [] : null),
    'white-space': (v) => [`whitespace-${v}`],
    'box-sizing': (v) => ({ 'border-box': ['box-border'], 'content-box': ['box-content'] }[v] || null),
    'text-decoration-line': (v) =>
      v === 'none' ? [] : { underline: ['underline'], 'line-through': ['line-through'], overline: ['overline'] }[v] || null,
  };

  const HANDLERS = {
    padding: (v) => boxClasses('p', v),
    margin: (v) => boxClasses('m', v),
    gap: (v) => {
      const parts = v.trim().split(/\s+/);
      if (parts.length === 1) return [spacingClass('gap', parts[0])];
      return [spacingClass('gap-y', parts[0]), spacingClass('gap-x', parts[1])];
    },
    'row-gap': (v) => [spacingClass('gap-y', v)],
    'column-gap': (v) => [spacingClass('gap-x', v)],
    width: (v) => [sizeClass('w', v, 'x')],
    height: (v) => [sizeClass('h', v, 'y')],
    'min-width': (v) => [sizeClass('min-w', v, 'x')],
    'min-height': (v) => [sizeClass('min-h', v, 'y')],
    'max-width': (v) => [sizeClass('max-w', v, 'x')],
    'max-height': (v) => [sizeClass('max-h', v, 'y')],
    top: (v) => [spacingClass('top', v)],
    right: (v) => [spacingClass('right', v)],
    bottom: (v) => [spacingClass('bottom', v)],
    left: (v) => [spacingClass('left', v)],
    color: (v) => [`text-[${normalizeColor(v)}]`],
    'background-color': (v) => (v === 'transparent' ? ['bg-transparent'] : [`bg-[${normalizeColor(v)}]`]),
    'font-size': (v) => {
      const px = parsePx(v);
      return px !== null && FONT_SIZE[px] ? [FONT_SIZE[px]] : [`text-[${v}]`];
    },
    'font-weight': (v) => (FONT_WEIGHT[v] ? [FONT_WEIGHT[v]] : [`font-[${v}]`]),
    'line-height': (v) => (v === 'normal' ? [] : [lineHeightClass(v)]),
    'letter-spacing': (v) => (v === 'normal' ? [] : [`tracking-[${v}]`]),
    border: borderClasses,
    'border-radius': radiusClasses,
    'border-color': (v) => [`border-[${normalizeColor(v)}]`],
    'border-width': (v) => {
      const px = parsePx(v);
      if (px === 1) return ['border'];
      return px !== null && [0, 2, 4, 8].includes(px) ? [`border-${px}`] : [`border-[${v}]`];
    },
    'border-style': (v) => (v === 'solid' ? [] : [`border-${v}`]),
    'box-shadow': (v) => (v === 'none' ? [] : [`shadow-[${stripSpaces(v)}]`]),
    opacity: (v) => {
      const n = Math.round(parseFloat(v) * 100);
      return Number.isFinite(n) ? [`opacity-${n}`] : null;
    },
    overflow: (v) => [`overflow-${v}`],
    'overflow-x': (v) => [`overflow-x-${v}`],
    'overflow-y': (v) => [`overflow-y-${v}`],
    cursor: (v) => [`cursor-${v.replace(/\s+/g, '_')}`],
    'z-index': (v) => {
      if (v === 'auto') return ['z-auto'];
      return ['0', '10', '20', '30', '40', '50'].includes(v) ? [`z-${v}`] : [`z-[${v}]`];
    },
    'grid-template-columns': (v) => {
      const m = /^repeat\((\d+),\s*minmax\(0(?:px)?,\s*1fr\)\)$/.exec(v.trim());
      if (m) return [`grid-cols-${m[1]}`];
      return [`grid-cols-[${stripSpaces(v)}]`];
    },
    'grid-template-rows': (v) => {
      const m = /^repeat\((\d+),\s*minmax\(0(?:px)?,\s*1fr\)\)$/.exec(v.trim());
      if (m) return [`grid-rows-${m[1]}`];
      return [`grid-rows-[${stripSpaces(v)}]`];
    },
    'flex-grow': (v) => (v === '1' ? ['grow'] : v === '0' ? ['grow-0'] : [`grow-[${v}]`]),
    'flex-shrink': (v) => (v === '1' ? ['shrink'] : v === '0' ? ['shrink-0'] : [`shrink-[${v}]`]),
    'align-self': (v) => {
      const map = { 'flex-start': 'self-start', start: 'self-start', center: 'self-center', 'flex-end': 'self-end', end: 'self-end', stretch: 'self-stretch', baseline: 'self-baseline', auto: 'self-auto' };
      return map[v] ? [map[v]] : null;
    },
    order: (v) => (/^-?\d+$/.test(v) && Math.abs(v) <= 12 ? [Number(v) < 0 ? `-order-${-v}` : `order-${v}`] : [`order-[${v}]`]),
  };

  function cssToTailwind(declarations) {
    const classes = [];
    const unmapped = [];
    for (const [prop, value] of declarations) {
      const handler = HANDLERS[prop] || KEYWORD_PROPS[prop];
      const result = handler ? handler(value) : null;
      if (result === null || result === undefined) unmapped.push([prop, value]);
      else classes.push(...result);
    }
    return { classes, unmapped };
  }

  const api = { cssToTailwind };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign((globalThis.__cssInspector ||= {}), api);
})();
