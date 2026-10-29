// Runs the full test suite (unit, integration, E2E) and writes one HTML report per phase to
// docs/test-reports/phase-<N>.html, as documentation that the phase's tests passed.
// Usage: node scripts/generate-test-report.mjs [--phase N]. Exits non-zero if any test failed.

import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'mms-report-'));

function phaseFromArgsOrFile() {
  const i = process.argv.indexOf('--phase');
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  const file = readFileSync(join(root, 'shraga', 'PHASE.md'), 'utf8');
  const m = file.match(/PHASE\s*=\s*(\d+)/);
  if (!m) throw new Error('Could not read PHASE from shraga/PHASE.md; pass --phase N.');
  return m[1];
}

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  try {
    execSync(cmd, { cwd: root, stdio: 'inherit' });
  } catch {
    // A failing suite still produces a JSON report; the report records the failures.
  }
}

const base = (name) => name.replace(/\\/g, '/').split('/').pop();

function vitest(file) {
  const j = JSON.parse(readFileSync(file, 'utf8'));
  const out = [];
  for (const r of j.testResults) {
    const f = base(r.name);
    for (const a of r.assertionResults) {
      out.push({
        file: f,
        suite: (a.ancestorTitles || []).join(' › '),
        title: a.title,
        status: a.status,
      });
    }
  }
  return out;
}

function playwright(file) {
  const j = JSON.parse(readFileSync(file, 'utf8'));
  const out = [];
  (function walk(suites) {
    for (const s of suites || []) {
      for (const sp of s.specs || []) {
        const status = sp.tests?.[0]?.results?.[0]?.status || (sp.ok ? 'passed' : 'failed');
        out.push({ file: base(sp.file || 'e2e'), suite: sp.title, title: sp.title, status });
      }
      walk(s.suites);
    }
  })(j.suites);
  return out;
}

const unitFile = join(tmp, 'unit.json');
const intFile = join(tmp, 'integration.json');
const e2eFile = join(tmp, 'e2e.json');

run(`npx vitest run --reporter=json --outputFile="${unitFile}"`);
run(`npx vitest run -c vitest.integration.config.js --reporter=json --outputFile="${intFile}"`);
run(`npx playwright test --reporter=json > "${e2eFile}"`);

const unit = vitest(unitFile);
const integration = vitest(intFile);
const e2e = playwright(e2eFile);

const sum = (a) => ({
  total: a.length,
  passed: a.filter((x) => x.status === 'passed').length,
  failed: a.filter((x) => x.status !== 'passed').length,
});
const results = {
  unit,
  integration,
  e2e,
  summary: { unit: sum(unit), integration: sum(integration), e2e: sum(e2e) },
};

const phase = phaseFromArgsOrFile();
const template = readFileSync(join(root, 'scripts', 'test-report-template.html'), 'utf8');
const html = template
  .replaceAll('__TITLE__', `בדיקות פאזה ${phase}`)
  .replace('__RESULTS__', JSON.stringify(results))
  .replace('__PHASE__', JSON.stringify(String(phase)))
  .replace('__GENERATED__', new Date().toISOString());

const outDir = join(root, 'docs', 'test-reports');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `phase-${phase}.html`);
writeFileSync(outFile, html);
rmSync(tmp, { recursive: true, force: true });

const all = [...unit, ...integration, ...e2e];
const failed = all.filter((x) => x.status !== 'passed').length;
console.log(
  `\nReport written: docs/test-reports/phase-${phase}.html` +
    ` (${all.length - failed}/${all.length} passed, unit ${results.summary.unit.passed}/${results.summary.unit.total},` +
    ` integration ${results.summary.integration.passed}/${results.summary.integration.total},` +
    ` e2e ${results.summary.e2e.passed}/${results.summary.e2e.total})`,
);
if (failed > 0) {
  console.error(`\n${failed} test(s) failed. The report records the failures.`);
  process.exit(1);
}
