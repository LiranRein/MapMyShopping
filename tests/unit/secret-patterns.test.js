import { describe, expect, it } from 'vitest';
import { findSecrets } from '../../scripts/secret-patterns.mjs';

function fakeJwt(payload) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.c2lnbmF0dXJlLXZhbHVl`;
}

describe('findSecrets', () => {
  it('flags a service_role JWT', () => {
    const text = `const k="${fakeJwt({ iss: 'supabase', role: 'service_role' })}";`;
    expect(findSecrets(text).map((f) => f.name)).toContain('jwt-role-service_role');
  });

  it('allows an anon JWT', () => {
    const text = `const k="${fakeJwt({ iss: 'supabase', role: 'anon' })}";`;
    expect(findSecrets(text)).toEqual([]);
  });

  it('flags a Supabase secret key', () => {
    expect(findSecrets('x="sb_secret_abcdefgh12345678"').map((f) => f.name)).toEqual([
      'supabase-secret-key',
    ]);
  });

  it('allows a Supabase publishable key', () => {
    expect(findSecrets('x="sb_publishable_abcdefgh12345678"')).toEqual([]);
  });

  it('flags the service-role env variable name, private keys and DB URLs with passwords', () => {
    const text = [
      'SUPABASE_SERVICE_ROLE_KEY',
      '-----BEGIN PRIVATE KEY-----',
      'postgresql://postgres:hunter22@db.example.co:5432/postgres',
    ].join('\n');
    expect(findSecrets(text).map((f) => f.name)).toEqual([
      'service-role-env-name',
      'private-key-block',
      'postgres-url-with-password',
    ]);
  });

  it('flags literal values of server-only env variables', () => {
    expect(
      findSecrets('a="my-server-only-value"', { extraValues: ['my-server-only-value'] }),
    ).toHaveLength(1);
  });

  it('returns no findings for clean code', () => {
    expect(findSecrets('export const a = 1; fetch("https://example.supabase.co");')).toEqual([]);
  });
});
