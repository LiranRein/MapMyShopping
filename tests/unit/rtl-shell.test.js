// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const tokens = readFileSync(
  new URL('../../src/presentation/styles/tokens.css', import.meta.url),
  'utf8',
);
const designSystem = readFileSync(
  new URL('../../shraga/DESIGN_SYSTEM.md', import.meta.url),
  'utf8',
);

describe('RTL shell', () => {
  it('declares Hebrew and right-to-left on the html element', () => {
    expect(html).toMatch(/<html lang="he" dir="rtl">/);
  });

  it('defines every color token from DESIGN_SYSTEM.md with the same value', () => {
    const rows = [
      ...designSystem.matchAll(/\|\s*(--(?:color|tint)-[a-z0-9-]+)\s*\|\s*(#[0-9A-F]{6})\s*\|/gi),
    ];
    expect(rows.length).toBeGreaterThan(15);
    for (const [, token, hex] of rows) {
      expect(tokens.toLowerCase()).toContain(`${token}: ${hex.toLowerCase()};`);
    }
  });
});
