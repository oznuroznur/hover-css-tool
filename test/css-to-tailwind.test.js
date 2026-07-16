const { test } = require('node:test');
const assert = require('node:assert');
const { cssToTailwind } = require('../src/lib/css-to-tailwind.js');

function classesOf(declarations) {
  return cssToTailwind(declarations).classes;
}

test('maps display and position keywords', () => {
  assert.deepStrictEqual(classesOf([['display', 'flex']]), ['flex']);
  assert.deepStrictEqual(classesOf([['display', 'none']]), ['hidden']);
  assert.deepStrictEqual(classesOf([['display', 'inline-block']]), ['inline-block']);
  assert.deepStrictEqual(classesOf([['position', 'absolute']]), ['absolute']);
});

test('maps flex container properties (flex container scenario)', () => {
  const out = classesOf([
    ['display', 'flex'],
    ['flex-direction', 'column'],
    ['justify-content', 'space-between'],
    ['align-items', 'center'],
    ['flex-wrap', 'wrap'],
    ['gap', '16px'],
  ]);
  assert.deepStrictEqual(out, ['flex', 'flex-col', 'justify-between', 'items-center', 'flex-wrap', 'gap-4']);
});

test('maps padding shorthand onto the spacing scale', () => {
  assert.deepStrictEqual(classesOf([['padding', '16px']]), ['p-4']);
  assert.deepStrictEqual(classesOf([['padding', '8px 16px']]), ['py-2', 'px-4']);
  assert.deepStrictEqual(classesOf([['padding', '1px']]), ['p-px']);
});

test('falls back to arbitrary values off the spacing scale', () => {
  assert.deepStrictEqual(classesOf([['padding', '13px']]), ['p-[13px]']);
  assert.deepStrictEqual(classesOf([['padding', '8px 13px']]), ['py-2', 'px-[13px]']);
});

test('maps four-sided padding per side', () => {
  assert.deepStrictEqual(classesOf([['padding', '4px 8px 12px 16px']]), [
    'pt-1',
    'pr-2',
    'pb-3',
    'pl-4',
  ]);
});

test('maps margin including negative and auto values', () => {
  assert.deepStrictEqual(classesOf([['margin', '16px']]), ['m-4']);
  assert.deepStrictEqual(classesOf([['margin', '-16px']]), ['-m-4']);
  assert.deepStrictEqual(classesOf([['margin', '0px auto']]), ['my-0', 'mx-auto']);
});

test('converts rgb colors to hex arbitrary values', () => {
  assert.deepStrictEqual(classesOf([['color', 'rgb(59, 130, 246)']]), ['text-[#3b82f6]']);
  assert.deepStrictEqual(classesOf([['background-color', 'rgb(255, 255, 255)']]), ['bg-[#ffffff]']);
});

test('keeps rgba colors as space-free arbitrary values', () => {
  assert.deepStrictEqual(classesOf([['background-color', 'rgba(0, 0, 0, 0.5)']]), [
    'bg-[rgba(0,0,0,0.5)]',
  ]);
});

test('maps typography (button scenario)', () => {
  const out = classesOf([
    ['font-size', '14px'],
    ['font-weight', '600'],
    ['text-align', 'center'],
    ['line-height', '20px'],
    ['text-transform', 'uppercase'],
  ]);
  assert.deepStrictEqual(out, ['text-sm', 'font-semibold', 'text-center', 'leading-5', 'uppercase']);
});

test('font-size off the scale becomes arbitrary', () => {
  assert.deepStrictEqual(classesOf([['font-size', '15px']]), ['text-[15px]']);
});

test('maps width and height', () => {
  assert.deepStrictEqual(classesOf([['width', '100%']]), ['w-full']);
  assert.deepStrictEqual(classesOf([['width', '64px']]), ['w-16']);
  assert.deepStrictEqual(classesOf([['height', 'auto']]), ['h-auto']);
  assert.deepStrictEqual(classesOf([['max-width', '250px']]), ['max-w-[250px]']);
});

test('maps border and border-radius (card scenario)', () => {
  const out = classesOf([
    ['border', '1px solid rgb(229, 231, 235)'],
    ['border-radius', '8px'],
    ['background-color', 'rgb(255, 255, 255)'],
    ['box-shadow', 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px'],
  ]);
  assert.deepStrictEqual(out, [
    'border',
    'border-[#e5e7eb]',
    'rounded-lg',
    'bg-[#ffffff]',
    'shadow-[rgba(0,0,0,0.1)_0px_1px_3px_0px]',
  ]);
});

test('border widths and styles map to their utilities', () => {
  assert.deepStrictEqual(classesOf([['border', '2px dashed rgb(0, 0, 0)']]), [
    'border-2',
    'border-dashed',
    'border-[#000000]',
  ]);
  assert.deepStrictEqual(classesOf([['border-radius', '9999px']]), ['rounded-full']);
  assert.deepStrictEqual(classesOf([['border-radius', '5px']]), ['rounded-[5px]']);
});

test('maps misc utilities', () => {
  assert.deepStrictEqual(classesOf([['opacity', '0.5']]), ['opacity-50']);
  assert.deepStrictEqual(classesOf([['overflow', 'hidden']]), ['overflow-hidden']);
  assert.deepStrictEqual(classesOf([['cursor', 'pointer']]), ['cursor-pointer']);
  assert.deepStrictEqual(classesOf([['z-index', '10']]), ['z-10']);
  assert.deepStrictEqual(classesOf([['z-index', '15']]), ['z-[15]']);
  assert.deepStrictEqual(
    classesOf([['grid-template-columns', 'repeat(3, minmax(0px, 1fr))']]),
    ['grid-cols-3']
  );
});

test('unmappable properties are reported, not silently dropped', () => {
  const out = cssToTailwind([
    ['display', 'flex'],
    ['font-family', 'Inter, sans-serif'],
  ]);
  assert.deepStrictEqual(out.classes, ['flex']);
  assert.deepStrictEqual(out.unmapped, [['font-family', 'Inter, sans-serif']]);
});
