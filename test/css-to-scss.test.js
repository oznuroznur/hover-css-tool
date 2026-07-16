const { test } = require('node:test');
const assert = require('node:assert');
const { cssToScss } = require('../src/lib/css-to-scss.js');

test('renders a simple declaration block', () => {
  const out = cssToScss('.btn', [
    ['display', 'inline-flex'],
    ['padding', '8px 16px'],
  ]);
  assert.strictEqual(out, '.btn {\n  display: inline-flex;\n  padding: 8px 16px;\n}\n');
});

test('extracts a repeated color into a variable', () => {
  const out = cssToScss('.btn', [
    ['color', '#3b82f6'],
    ['background-color', '#ffffff'],
    ['border-color', '#3b82f6'],
  ]);
  assert.strictEqual(
    out,
    '$color-1: #3b82f6;\n\n.btn {\n  color: $color-1;\n  background-color: #ffffff;\n  border-color: $color-1;\n}\n'
  );
});

test('extracts multiple repeated colors as separate variables in first-seen order', () => {
  const out = cssToScss('.card', [
    ['color', '#111827'],
    ['border-color', '#e5e7eb'],
    ['background-color', '#e5e7eb'],
    ['outline-color', '#111827'],
  ]);
  assert.ok(out.startsWith('$color-1: #111827;\n$color-2: #e5e7eb;\n\n'));
  assert.ok(out.includes('color: $color-1;'));
  assert.ok(out.includes('border-color: $color-2;'));
  assert.ok(out.includes('background-color: $color-2;'));
  assert.ok(out.includes('outline-color: $color-1;'));
});

test('does not extract colors that appear only once', () => {
  const out = cssToScss('span', [['color', '#ff0000']]);
  assert.strictEqual(out, 'span {\n  color: #ff0000;\n}\n');
});

test('only color-bearing properties participate in variable extraction', () => {
  // '16px' repeats but is not a color property.
  const out = cssToScss('div', [
    ['padding', '16px'],
    ['margin', '16px'],
  ]);
  assert.strictEqual(out, 'div {\n  padding: 16px;\n  margin: 16px;\n}\n');
});

test('finds repeated color inside a shorthand value (border)', () => {
  const out = cssToScss('.box', [
    ['color', '#0ea5e9'],
    ['border', '1px solid #0ea5e9'],
  ]);
  assert.strictEqual(
    out,
    '$color-1: #0ea5e9;\n\n.box {\n  color: $color-1;\n  border: 1px solid $color-1;\n}\n'
  );
});

test('empty declarations produce an empty block', () => {
  assert.strictEqual(cssToScss('.x', []), '.x {\n}\n');
});
