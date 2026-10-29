// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const sources = listFiles(SRC).map((path) => ({ path, text: readFileSync(path, 'utf8') }));

describe('T-1.17 service-role key stays out of client code (AC-1.11)', () => {
  it('scans the client sources', () => {
    expect(sources.length).toBeGreaterThan(10);
  });

  it('never references test-only or server-only variables from src/', () => {
    for (const { path, text } of sources) {
      expect(text, path).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE|sb_secret_/);
      expect(text, path).not.toMatch(/\.env\.test|process\.env/);
      expect(text, path).not.toMatch(
        /import\.meta\.env\.(?!VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\w/,
      );
    }
  });

  it('never imports the test harness or the admin API', () => {
    for (const { path, text } of sources) {
      expect(text, path).not.toMatch(/tests\/|auth\.admin/);
    }
  });

  it('keeps Supabase calls out of the presentation layer', () => {
    for (const { path, text } of sources.filter((s) => s.path.includes('presentation'))) {
      expect(text, path).not.toMatch(/supabase|data-sync/i);
    }
  });
});
