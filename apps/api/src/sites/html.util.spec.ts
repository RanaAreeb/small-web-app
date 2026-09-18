import { readFileSync } from 'fs';
import { join } from 'path';
import {
  extractSearchableText,
  sanitizeSiteHtml,
} from './html.util';

const maliciousHtml = readFileSync(
  join(__dirname, 'fixtures', 'malicious.html'),
  'utf8',
);

describe('sanitizeSiteHtml', () => {
  it('removes malicious scripts', () => {
    const sanitized = sanitizeSiteHtml(maliciousHtml);

    expect(sanitized).not.toMatch(/<script/i);
    expect(sanitized).not.toContain('alert(');
    expect(sanitized).not.toContain('document.cookie');
  });

  it('removes event handler attributes', () => {
    const sanitized = sanitizeSiteHtml(maliciousHtml);

    expect(sanitized).not.toMatch(/on\w+=/i);
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('onmouseover');
    expect(sanitized).not.toContain('onerror');
  });

  it('removes javascript: href values', () => {
    const sanitized = sanitizeSiteHtml(
      '<a href="javascript:alert(1)">Click</a>',
    );

    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toMatch(/href=["']javascript:/i);
    expect(sanitized).toContain('Click');
  });

  it('preserves valid .zz links', () => {
    const sanitized = sanitizeSiteHtml(
      '<a href="Friend.ZZ." title="A friend">Good link</a>',
    );

    expect(sanitized).toContain('href="friend.zz"');
    expect(sanitized).toContain('title="A friend"');
    expect(sanitized).toContain('Good link');
  });

  it('removes forms, iframes, media and external resources', () => {
    const sanitized = sanitizeSiteHtml(maliciousHtml);

    expect(sanitized).not.toMatch(/<form/i);
    expect(sanitized).not.toMatch(/<iframe/i);
    expect(sanitized).not.toMatch(/<object/i);
    expect(sanitized).not.toMatch(/<embed/i);
    expect(sanitized).not.toMatch(/<img/i);
    expect(sanitized).not.toMatch(/<audio/i);
    expect(sanitized).not.toMatch(/<video/i);
    expect(sanitized).not.toContain('https://evil.example');
  });
});

describe('extractSearchableText', () => {
  it('extracts visible text for search indexing', () => {
    const sanitized = sanitizeSiteHtml(maliciousHtml);
    const text = extractSearchableText(sanitized);

    expect(text).toContain('Welcome');
    expect(text).toContain('Visible content for search indexing.');
    expect(text).toContain('Good link');
    expect(text).not.toContain('alert(');
    expect(text).not.toContain('<script');
  });
});
