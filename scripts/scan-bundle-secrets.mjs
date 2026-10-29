import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findSecrets } from './secret-patterns.mjs';

const SCANNED_EXTENSIONS = /\.(js|mjs|css|html|json|map|txt|webmanifest|svg)$/i;
const SERVER_ONLY_ENV = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_PASSWORD',
  'SUPABASE_ACCESS_TOKEN',
];

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const root = process.argv[2] ?? 'dist';
const extraValues = SERVER_ONLY_ENV.map((key) => process.env[key]).filter(Boolean);
const files = listFiles(root).filter((file) => SCANNED_EXTENSIONS.test(file));

let total = 0;
for (const file of files) {
  const findings = findSecrets(readFileSync(file, 'utf8'), { extraValues });
  for (const finding of findings) {
    console.error(
      `SECRET FOUND: ${finding.name} in ${relative(root, file)} at offset ${finding.index}`,
    );
  }
  total += findings.length;
}

if (total > 0) {
  console.error(`Bundle secret scan failed: ${total} finding(s) in ${files.length} file(s).`);
  process.exit(1);
}
console.log(`Bundle secret scan passed: ${files.length} file(s) scanned in ${root}, 0 findings.`);
