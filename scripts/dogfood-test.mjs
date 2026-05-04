import { existsSync, readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function findIterationDir() {
  const activeWorkDir = join(projectRoot, 'work');
  if (existsSync(join(activeWorkDir, 'task-graph.md'))) {
    return activeWorkDir;
  }

  const archiveIterationsDir = join(projectRoot, 'work', 'archive', 'iterations');
  if (existsSync(archiveIterationsDir)) {
    const archived = readdirSync(archiveIterationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(archiveIterationsDir, entry.name))
      .filter((dir) => existsSync(join(dir, 'task-graph.md')))
      .sort();
    const latest = archived.at(-1);
    if (latest) return latest;
  }

  throw new Error('No active or archived task-graph.md found');
}

const iterationDir = findIterationDir();

function parseStatus(statusStr) {
  const s = statusStr.trim();
  if (s === '[x]') return 'completed';
  if (s === '[/]') return 'in-progress';
  if (s === '[!]') return 'blocked';
  return 'pending';
}

function parseDependencies(depsStr) {
  const s = depsStr.trim();
  if (s === '—' || s === '-' || s === '' || s === '[]') return [];
  const cleaned = s.replace(/^\[(.*)\]$/, '$1');
  if (!cleaned.trim()) return [];
  return cleaned.split(',').map((d) => d.trim()).filter(Boolean);
}

function splitTableRow(line) {
  const trimmed = line.trim();
  const withoutLeadingPipe = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const withoutTrailingPipe = withoutLeadingPipe.endsWith('|')
    ? withoutLeadingPipe.slice(0, -1)
    : withoutLeadingPipe;
  return withoutTrailingPipe.split('|').map((p) => p.trim());
}

function isSeparatorRow(parts) {
  return parts.length > 0 && parts.every((part) => /^:?-{3,}:?$/.test(part));
}

function isTaskTableHeader(parts) {
  const normalized = parts.map((p) => p.toLowerCase());
  return (
    normalized.includes('id') &&
    normalized.includes('title') &&
    normalized.includes('status') &&
    normalized.includes('acceptance criteria') &&
    normalized.includes('write scope') &&
    normalized.includes('dependencies')
  );
}

function parseTaskGraph(content, filename) {
  const tasks = [];
  const errors = [];
  const lines = content.split('\n');
  let currentWave = 0;
  let inTaskTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const waveMatch = line.match(/^#{2,6}\s*Wave\s*(\d+)\b/i);
    if (waveMatch) {
      currentWave = parseInt(waveMatch[1], 10);
      inTaskTable = false;
      continue;
    }

    if (!line.trim().startsWith('|')) {
      inTaskTable = false;
      continue;
    }

    const parts = splitTableRow(line);
    if (isSeparatorRow(parts)) continue;
    if (isTaskTableHeader(parts)) {
      inTaskTable = true;
      continue;
    }
    if (!inTaskTable) continue;

    const id = parts[0];
    if (!id?.match(/^T\d+\.\d+$/)) continue;
    if (parts.length < 6) {
      errors.push({ file: filename, message: `Malformed task row at line ${i + 1}`, line: i + 1 });
      continue;
    }

    const [taskId, title, statusStr, acceptanceCriteria, writeScope, depsStr] = parts;
    tasks.push({
      id: taskId,
      title,
      status: parseStatus(statusStr),
      acceptanceCriteria,
      writeScope,
      dependencies: parseDependencies(depsStr),
      wave: currentWave,
    });
  }
  return { tasks, errors };
}

const taskGraphContent = readFileSync(join(iterationDir, 'task-graph.md'), 'utf-8');
const result = parseTaskGraph(taskGraphContent, 'task-graph.md');

console.log('=== Dogfooding Parser Validation ===\n');
console.log(`Source: ${iterationDir}\n`);

console.log(`1. Task count: ${result.tasks.length} (expected: 13)`);
const taskCountOk = result.tasks.length === 13;
console.log(`   Status: ${taskCountOk ? 'PASS' : 'FAIL'}\n`);

const expectedIds = [
  'T0.1',
  'T1.1', 'T1.2', 'T1.3',
  'T2.1',
  'T3.1', 'T3.2', 'T3.3',
  'T4.1', 'T4.2', 'T4.3',
  'T5.1', 'T5.2',
];
const actualIds = result.tasks.map((t) => t.id);
const idsMatch = expectedIds.every((id) => actualIds.includes(id)) && actualIds.length === expectedIds.length;
console.log(`2. Task IDs present: ${idsMatch ? 'PASS' : 'FAIL'}`);
if (!idsMatch) {
  const missing = expectedIds.filter((id) => !actualIds.includes(id));
  const extra = actualIds.filter((id) => !expectedIds.includes(id));
  if (missing.length) console.log(`   Missing: ${missing.join(', ')}`);
  if (extra.length) console.log(`   Extra: ${extra.join(', ')}`);
}
console.log();

const completedTasks = result.tasks.filter((t) => t.status === 'completed');
console.log(`3. Completed tasks: ${completedTasks.length} (expected: 13)`);
const completedOk = completedTasks.length === 13;
console.log(`   Status: ${completedOk ? 'PASS' : 'FAIL'}\n`);

const waveCounts = {};
for (const t of result.tasks) {
  waveCounts[t.wave] = (waveCounts[t.wave] || 0) + 1;
}
const expectedWaveCounts = { 0: 1, 1: 3, 2: 1, 3: 3, 4: 3, 5: 2 };
console.log('4. Wave distribution:');
let wavesOk = true;
for (const [wave, expectedCount] of Object.entries(expectedWaveCounts)) {
  const actualCount = waveCounts[wave] ?? 0;
  console.log(`   W${wave}: ${actualCount} task${actualCount === 1 ? '' : 's'} (expected: ${expectedCount})`);
  if (actualCount !== expectedCount) wavesOk = false;
}
console.log(`   Status: ${wavesOk ? 'PASS' : 'FAIL'}\n`);

const depsMap = {};
for (const t of result.tasks) {
  depsMap[t.id] = t.dependencies;
}
console.log('5. Dependency check:');
let depsOk = true;
for (const [id, deps] of Object.entries(depsMap)) {
  for (const dep of deps) {
    if (!actualIds.includes(dep)) {
      console.log(`   FAIL: ${id} depends on unknown task ${dep}`);
      depsOk = false;
    }
  }
}
if (depsOk) console.log('   All dependencies reference valid tasks: PASS');
console.log();

console.log(`6. Parse errors: ${result.errors.length}`);
const errorsOk = result.errors.length === 0;
console.log(`   Status: ${errorsOk ? 'PASS' : 'FAIL'}`);
if (result.errors.length > 0) {
  for (const e of result.errors) console.log(`   - ${e.message} (${e.file}:${e.line})`);
}
console.log();

const allPass = taskCountOk && idsMatch && completedOk && wavesOk && depsOk && errorsOk;
console.log('=== Summary ===');
console.log(`Overall: ${allPass ? 'ALL CHECKS PASS' : 'SOME CHECKS FAILED'}`);

process.exit(allPass ? 0 : 1);
