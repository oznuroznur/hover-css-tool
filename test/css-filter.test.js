const { test } = require('node:test');
const assert = require('node:assert');
const { extractStyles } = require('../src/lib/css-filter.js');

// Helper: baseline object where every queried property defaults to a value.
function baseline(overrides = {}) {
  return {
    display: 'block',
    position: 'static',
    color: 'rgb(0, 0, 0)',
    'background-color': 'rgba(0, 0, 0, 0)',
    'font-size': '16px',
    'font-weight': '400',
    'margin-top': '0px', 'margin-right': '0px', 'margin-bottom': '0px', 'margin-left': '0px',
    'padding-top': '0px', 'padding-right': '0px', 'padding-bottom': '0px', 'padding-left': '0px',
    'border-top-width': '0px', 'border-right-width': '0px', 'border-bottom-width': '0px', 'border-left-width': '0px',
    'border-top-style': 'none', 'border-right-style': 'none', 'border-bottom-style': 'none', 'border-left-style': 'none',
    'border-top-color': 'rgb(0, 0, 0)', 'border-right-color': 'rgb(0, 0, 0)', 'border-bottom-color': 'rgb(0, 0, 0)', 'border-left-color': 'rgb(0, 0, 0)',
    'border-top-left-radius': '0px', 'border-top-right-radius': '0px', 'border-bottom-right-radius': '0px', 'border-bottom-left-radius': '0px',
    'row-gap': 'normal', 'column-gap': 'normal',
    ...overrides,
  };
}

test('keeps only properties that differ from the baseline', () => {
  const computed = baseline({ display: 'flex', color: 'rgb(255, 0, 0)' });
  const out = extractStyles(computed, baseline());
  assert.deepStrictEqual(out, [
    ['display', 'flex'],
    ['color', 'rgb(255, 0, 0)'],
  ]);
});

test('ignores properties outside the tracked list', () => {
  const computed = baseline({ '-webkit-locale': '"tr"' });
  const out = extractStyles(computed, baseline());
  assert.deepStrictEqual(out, []);
});

test('orders output by group: layout, box, flex, typography, visual', () => {
  const computed = baseline({
    color: 'rgb(255, 0, 0)',
    display: 'flex',
    'background-color': 'rgb(255, 255, 255)',
    'padding-top': '16px', 'padding-right': '16px', 'padding-bottom': '16px', 'padding-left': '16px',
    position: 'relative',
  });
  const out = extractStyles(computed, baseline());
  assert.deepStrictEqual(out.map(([p]) => p), [
    'display', 'position', 'padding', 'color', 'background-color',
  ]);
});

test('collapses uniform padding into a single value', () => {
  const computed = baseline({
    'padding-top': '16px', 'padding-right': '16px', 'padding-bottom': '16px', 'padding-left': '16px',
  });
  assert.deepStrictEqual(extractStyles(computed, baseline()), [['padding', '16px']]);
});

test('collapses symmetric padding into two values', () => {
  const computed = baseline({
    'padding-top': '8px', 'padding-right': '16px', 'padding-bottom': '8px', 'padding-left': '16px',
  });
  assert.deepStrictEqual(extractStyles(computed, baseline()), [['padding', '8px 16px']]);
});

test('emits full shorthand when only one side differs', () => {
  const computed = baseline({ 'margin-bottom': '24px' });
  assert.deepStrictEqual(extractStyles(computed, baseline()), [['margin', '0px 0px 24px']]);
});

test('collapses a uniform border into the border shorthand', () => {
  const computed = baseline({
    'border-top-width': '1px', 'border-right-width': '1px', 'border-bottom-width': '1px', 'border-left-width': '1px',
    'border-top-style': 'solid', 'border-right-style': 'solid', 'border-bottom-style': 'solid', 'border-left-style': 'solid',
    'border-top-color': 'rgb(229, 231, 235)', 'border-right-color': 'rgb(229, 231, 235)', 'border-bottom-color': 'rgb(229, 231, 235)', 'border-left-color': 'rgb(229, 231, 235)',
  });
  assert.deepStrictEqual(extractStyles(computed, baseline()), [
    ['border', '1px solid rgb(229, 231, 235)'],
  ]);
});

test('includes border even when border-color matches the baseline currentColor', () => {
  // Border color defaults to the text color; a real border in that color must
  // still be reported once the style flips away from none.
  const computed = baseline({
    'border-top-width': '2px', 'border-right-width': '2px', 'border-bottom-width': '2px', 'border-left-width': '2px',
    'border-top-style': 'solid', 'border-right-style': 'solid', 'border-bottom-style': 'solid', 'border-left-style': 'solid',
  });
  assert.deepStrictEqual(extractStyles(computed, baseline()), [
    ['border', '2px solid rgb(0, 0, 0)'],
  ]);
});

test('emits per-side border when only one side is set', () => {
  const computed = baseline({
    'border-bottom-width': '1px',
    'border-bottom-style': 'solid',
    'border-bottom-color': 'rgb(0, 0, 255)',
  });
  assert.deepStrictEqual(extractStyles(computed, baseline()), [
    ['border-bottom', '1px solid rgb(0, 0, 255)'],
  ]);
});

test('collapses border-radius corners', () => {
  const uniform = baseline({
    'border-top-left-radius': '8px', 'border-top-right-radius': '8px',
    'border-bottom-right-radius': '8px', 'border-bottom-left-radius': '8px',
  });
  assert.deepStrictEqual(extractStyles(uniform, baseline()), [['border-radius', '8px']]);

  const top = baseline({
    'border-top-left-radius': '8px', 'border-top-right-radius': '8px',
  });
  assert.deepStrictEqual(extractStyles(top, baseline()), [['border-radius', '8px 8px 0px 0px']]);
});

test('collapses row/column gap into gap', () => {
  const equal = baseline({ 'row-gap': '16px', 'column-gap': '16px' });
  assert.deepStrictEqual(extractStyles(equal, baseline()), [['gap', '16px']]);

  const mixed = baseline({ 'row-gap': '8px', 'column-gap': '16px' });
  assert.deepStrictEqual(extractStyles(mixed, baseline()), [['gap', '8px 16px']]);
});
