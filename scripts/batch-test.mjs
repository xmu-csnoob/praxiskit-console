import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function findIterationDir() {
  const activeWorkDir = 'work';
  if (existsSync(join(activeWorkDir, 'task-graph.md'))) {
    return activeWorkDir;
  }

  const archiveIterationsDir = join('work', 'archive', 'iterations');
  if (existsSync(archiveIterationsDir)) {
    const archived = readdirSync(archiveIterationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(archiveIterationsDir, entry.name))
      .filter((dir) => existsSync(join(dir, 'task-graph.md')))
      .sort();
    const latest = archived.at(-1);
    if (latest) return latest;
  }

  throw new Error('No active or archived iteration found');
}

function extractMetadataValue(content, key) {
  const regex = new RegExp('^\\s*[-*]?\\s*\\*{0,2}' + key + '\\*{0,2}\\s*:\\s*(.+)$', 'im');
  const match = content.match(regex);
  return match ? match[1].trim() : undefined;
}

function extractSection(content, heading) {
  const lines = content.split('\n');
  const startRegex = new RegExp('^#{2,6}\\s+' + heading + '\\s*$', 'i');
  let start = -1;

  for (let i = 0; i < lines.length; i++) {
    if (startRegex.test(lines[i].trim())) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return undefined;

  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (/^#{2,6}\s+/.test(lines[i].trim())) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

function extractSectionValue(content, heading, key) {
  const section = extractSection(content, heading);
  return section ? extractMetadataValue(section, key) : undefined;
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

function normalizeHeader(header) {
  return header.toLowerCase().replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim();
}

function getColumnIndex(headers, aliases) {
  return headers.findIndex((header) => aliases.includes(header));
}

function parseDependencies(depsStr) {
  const s = depsStr.trim();
  if (s === '—' || s === '-' || s === '' || s === '[]') return [];
  return s.match(/T\d+\.\d+/g) ?? [];
}

function parseBatch(content, filename) {
  const idMatch = filename.match(/execution-batch-(\d+)\.md$/);
  const id = idMatch ? parseInt(idMatch[1], 10) : 0;
  const authRaw =
    extractMetadataValue(content, 'Authorization') ??
    extractSectionValue(content, 'Authorization', 'Mode') ??
    'dry-run';
  const authorization = authRaw.toLowerCase().includes('execute') ? 'execute' : 'dry-run';
  const baselineRaw =
    extractMetadataValue(content, 'Baseline status') ??
    extractSectionValue(content, 'Baseline', 'Status') ??
    'unavailable';
  const baselineStatus = baselineRaw.split(/\s+/)[0].toLowerCase();

  const tasks = [];
  const lines = content.split('\n');
  let inSelectedTasks = false;
  let headers = null;

  for (const line of lines) {
    if (line.includes('## Selected Tasks')) {
      inSelectedTasks = true;
      headers = null;
      continue;
    }
    if (inSelectedTasks && line.startsWith('## ')) break;
    if (!inSelectedTasks || !line.trim().startsWith('|')) continue;

    const parts = splitTableRow(line);
    if (isSeparatorRow(parts)) continue;

    const normalized = parts.map(normalizeHeader);
    if (normalized.includes('id') && normalized.includes('title')) {
      headers = normalized;
      continue;
    }
    if (!headers || parts.length < 2) continue;

    const taskId = parts[getColumnIndex(headers, ['id'])] ?? '';
    if (!taskId.match(/^T\d+\.\d+$/)) continue;

    const title = parts[getColumnIndex(headers, ['title'])] ?? '';
    const statusIndex = getColumnIndex(headers, ['status at selection', 'status at batch', 'status']);
    const depsIndex = getColumnIndex(headers, ['dependencies']);
    const writeScopeIndex = getColumnIndex(headers, ['write scope']);

    tasks.push({
      id: taskId,
      title,
      statusAtSelection: statusIndex >= 0 ? parts[statusIndex] ?? '' : '',
      dependencies: depsIndex >= 0 ? parseDependencies(parts[depsIndex] ?? '') : [],
      writeScope: writeScopeIndex >= 0 ? parts[writeScopeIndex] ?? '' : '',
    });
  }

  return { batch: { id, tasks, authorization, baselineStatus }, errors: [] };
}

const workDir = findIterationDir();
const batchFiles = readdirSync(workDir)
  .filter((f) => f.startsWith('execution-batch-') && f.endsWith('.md'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

console.log('=== Batch Parser Dogfooding ===\n');
console.log(`Source: ${workDir}\n`);
console.log(`Batch files found: ${batchFiles.length} (expected: 10)`);
const countOk = batchFiles.length === 10;
console.log(`Status: ${countOk ? 'PASS' : 'FAIL'}\n`);

let allAuthsOk = true;
let allBaselineOk = true;
let allTasksOk = true;
let allDepsOk = true;
for (const f of batchFiles) {
  const content = readFileSync(join(workDir, f), 'utf-8');
  const result = parseBatch(content, f);
  const authOk = result.batch.authorization === 'execute';
  const baselineOk = result.batch.baselineStatus === 'pass';
  const hasTasks = result.batch.tasks.length > 0;
  const depsOk = result.batch.tasks.every((task) => task.dependencies.every((dep) => /^T\d+\.\d+$/.test(dep)));
  console.log(
    `  ${f}: id=${result.batch.id}, tasks=${result.batch.tasks.length}, auth=${result.batch.authorization}, baseline=${result.batch.baselineStatus} ${
      authOk && baselineOk && hasTasks && depsOk ? 'PASS' : 'FAIL'
    }`
  );
  if (!authOk) allAuthsOk = false;
  if (!baselineOk) allBaselineOk = false;
  if (!hasTasks) allTasksOk = false;
  if (!depsOk) allDepsOk = false;
}

console.log(`\nAuthorization values: ${allAuthsOk ? 'PASS' : 'FAIL'}`);
console.log(`Baseline values: ${allBaselineOk ? 'PASS' : 'FAIL'}`);
console.log(`All batches have tasks: ${allTasksOk ? 'PASS' : 'FAIL'}`);
console.log(`Dependencies normalized: ${allDepsOk ? 'PASS' : 'FAIL'}`);

const allMdFiles = readdirSync(workDir).filter((f) => f.endsWith('.md'));
const hasTaskGraph = allMdFiles.includes('task-graph.md');
const hasPRD = allMdFiles.includes('PRD.md');
const hasIdea = allMdFiles.includes('idea.md');
console.log('\nCore files present:');
console.log(`  task-graph.md: ${hasTaskGraph ? 'PASS' : 'FAIL'}`);
console.log(`  PRD.md: ${hasPRD ? 'PASS' : 'FAIL'}`);
console.log(`  idea.md: ${hasIdea ? 'PASS' : 'FAIL'}`);

const overall = countOk && allAuthsOk && allBaselineOk && allTasksOk && allDepsOk && hasTaskGraph && hasPRD && hasIdea;
console.log('\n=== Summary ===');
console.log(`Overall: ${overall ? 'ALL CHECKS PASS' : 'SOME CHECKS FAILED'}`);
process.exit(overall ? 0 : 1);
