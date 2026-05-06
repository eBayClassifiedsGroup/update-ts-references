const path = require('path');
const { ensureLeadingDotSlash } = require('../src/update-ts-references');

test('returns null as-is', () => {
    expect(ensureLeadingDotSlash(null)).toBe(null);
});

test('returns undefined as-is', () => {
    expect(ensureLeadingDotSlash(undefined)).toBe(undefined);
});

test('returns . for empty string', () => {
    expect(ensureLeadingDotSlash('')).toBe('.');
});

test('returns absolute path as-is', () => {
    const p = path.resolve('/some/absolute/path');
    expect(ensureLeadingDotSlash(p)).toBe(p);
});

test('returns path already starting with .' + path.sep + ' as-is', () => {
    const p = '.' + path.sep + 'foo';
    expect(ensureLeadingDotSlash(p)).toBe(p);
});

test('returns path already starting with ..' + path.sep + ' as-is', () => {
    const p = '..' + path.sep + 'foo';
    expect(ensureLeadingDotSlash(p)).toBe(p);
});

test('prepends .' + path.sep + ' to a plain relative path', () => {
    expect(ensureLeadingDotSlash('foo')).toBe('.' + path.sep + 'foo');
});

test('prepends .' + path.sep + ' to a nested relative path', () => {
    expect(ensureLeadingDotSlash('foo' + path.sep + 'bar')).toBe('.' + path.sep + 'foo' + path.sep + 'bar');
});
