import { describe, expect, it } from 'vitest';
import { readPublicConfig } from '../../src/data-sync/publicConfig.js';

describe('readPublicConfig', () => {
  it('returns the Supabase URL and anon key', () => {
    expect(
      readPublicConfig({
        VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
        VITE_SUPABASE_ANON_KEY: 'k',
        MODE: 'test',
      }),
    ).toEqual({ supabaseUrl: 'http://127.0.0.1:54321', supabaseAnonKey: 'k' });
  });

  it('rejects any other public variable', () => {
    expect(() => readPublicConfig({ VITE_SUPABASE_SERVICE_ROLE_KEY: 'x' })).toThrow(
      /VITE_SUPABASE_SERVICE_ROLE_KEY/,
    );
  });
});
