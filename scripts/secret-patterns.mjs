const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{8,}/g;

const STATIC_PATTERNS = [
  { name: 'supabase-secret-key', regex: /sb_secret_[A-Za-z0-9_-]{8,}/g },
  { name: 'service-role-env-name', regex: /SUPABASE_SERVICE_ROLE_KEY/g },
  { name: 'private-key-block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: 'postgres-url-with-password', regex: /postgres(?:ql)?:\/\/[^:\s"'`/]+:[^@\s"'`]+@/g },
];

function decodeJwtPayload(segment) {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export function findSecrets(text, { extraValues = [] } = {}) {
  const findings = [];

  for (const { name, regex } of STATIC_PATTERNS) {
    for (const match of text.matchAll(regex)) {
      findings.push({ name, index: match.index });
    }
  }

  for (const match of text.matchAll(JWT_PATTERN)) {
    const payload = decodeJwtPayload(match[1]);
    if (payload && payload.role && payload.role !== 'anon') {
      findings.push({ name: `jwt-role-${payload.role}`, index: match.index });
    }
  }

  for (const value of extraValues) {
    if (value && value.length >= 8) {
      const index = text.indexOf(value);
      if (index !== -1) findings.push({ name: 'server-env-value', index });
    }
  }

  return findings;
}
