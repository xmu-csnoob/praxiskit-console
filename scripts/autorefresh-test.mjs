import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

function createFingerprint(files) {
  const entries = Array.from(files.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let hash = 0;
  for (const [path, content] of entries) {
    const str = path + ':' + content.length + ':' + content;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
  }
  return String(hash);
}

function splitMarkdownTableRow(line) {
  const trimmed = line.trim();
  const withoutLeadingPipe = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const withoutTrailingPipe = withoutLeadingPipe.endsWith('|')
    ? withoutLeadingPipe.slice(0, -1)
    : withoutLeadingPipe;
  return withoutTrailingPipe.split('|').map((p) => p.trim());
}

function createTaskGraphStructureFingerprint(content) {
  const structuralLines = [];
  for (const line of content.split('\n')) {
    if (/^#{2,6}\s*Wave\s*\d+\b/i.test(line)) {
      structuralLines.push(line.trim());
      continue;
    }
    if (!line.trim().startsWith('|')) continue;
    const cells = splitMarkdownTableRow(line);
    if (!cells[0]?.match(/^T\d+\.\d+$/)) continue;
    structuralLines.push([cells[0], cells[1], cells[3], cells[4], cells[5]].join('|'));
  }
  return structuralLines.join('\n');
}

const workDir = 'work';

function findIterationDir() {
  if (existsSync(join(workDir, 'task-graph.md'))) {
    return workDir;
  }

  const archiveIterationsDir = join(workDir, 'archive', 'iterations');
  if (existsSync(archiveIterationsDir)) {
    const archived = readdirSync(archiveIterationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(archiveIterationsDir, entry.name))
      .filter((dir) => existsSync(join(dir, 'task-graph.md')))
      .sort();
    const latest = archived.at(-1);
    if (latest) return latest;
  }

  return workDir;
}

// Read key files (same logic as useFileWatcher)
function readKeyFiles() {
  const files = new Map();
  const entries = readdirSync(workDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    if (!name.endsWith('.md')) continue;
    const content = readFileSync(join(workDir, name), 'utf-8');
    files.set(`work/${name}`, content);
  }
  try {
    files.set('seed.md', readFileSync('seed.md', 'utf-8'));
  } catch {
    // seed.md is optional
  }
  return files;
}

console.log('=== Auto-Refresh Test ===\n');

// Initial fingerprint
const filesBefore = readKeyFiles();
const fpBefore = createFingerprint(filesBefore);
console.log(`1. Initial fingerprint: ${fpBefore}`);
console.log(`   Key files tracked: ${filesBefore.size}`);
console.log(`   Status: PASS\n`);

// Modify an active key file and revert it. If the active work tree has no
// task graph because the last iteration was archived, use seed.md instead.
const activeTaskGraphPath = join(workDir, 'task-graph.md');
const targetPath = existsSync(activeTaskGraphPath) ? activeTaskGraphPath : 'seed.md';
const originalContent = readFileSync(targetPath, 'utf-8');
const modifiedContent = originalContent + '\n<!-- autorefresh-test-marker -->\n';
writeFileSync(targetPath, modifiedContent, 'utf-8');
console.log(`2. Modified ${targetPath} (added test marker)`);

// Read again and compare
const filesAfter = readKeyFiles();
const fpAfter = createFingerprint(filesAfter);
console.log(`   Fingerprint after: ${fpAfter}`);
const changed = fpBefore !== fpAfter;
console.log(`   Fingerprint changed: ${changed ? 'YES - PASS' : 'NO - FAIL'}\n`);

const structureUnchanged =
  createTaskGraphStructureFingerprint(readFileSync(join(findIterationDir(), 'task-graph.md'), 'utf-8')) ===
  createTaskGraphStructureFingerprint(readFileSync(join(findIterationDir(), 'task-graph.md'), 'utf-8') + '\n<!-- autorefresh-test-marker -->\n');
console.log(`   Structural fingerprint unchanged for comment-only edit: ${structureUnchanged ? 'PASS' : 'FAIL'}\n`);

// Revert the change
writeFileSync(targetPath, originalContent, 'utf-8');
console.log(`3. Reverted ${targetPath}`);

const filesReverted = readKeyFiles();
const fpReverted = createFingerprint(filesReverted);
const backToOriginal = fpBefore === fpReverted;
console.log(`   Fingerprint matches original: ${backToOriginal ? 'PASS' : 'FAIL'}\n`);

// Check that batch-8 auth change is detected
const batch8Path = join(findIterationDir(), 'execution-batch-8.md');
const batch8Content = readFileSync(batch8Path, 'utf-8');
const hasExecute = /\*{0,2}Authorization\*{0,2}:\s*execute/i.test(batch8Content);
console.log('4. Batch-8 authorization state:');
console.log(`   Contains 'execute' authorization: ${hasExecute ? 'PASS' : 'FAIL'}\n`);

const overall = changed && structureUnchanged && backToOriginal && hasExecute;
console.log('=== Summary ===');
console.log(`Overall: ${overall ? 'ALL CHECKS PASS' : 'SOME CHECKS FAILED'}`);
process.exit(overall ? 0 : 1);
