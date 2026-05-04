import type { DirectoryEntry, FileSystemAdapter } from '../fs/directoryReader';
import { WAVE_ARCHIVE_DIR } from './types';

export interface WaveDescriptor {
  id: string;
  name: string;
  path: string;
  isActive: boolean;
  archivedAt?: string;
}

const ITERATION_DIR_PATTERN = /^(?:iteration|wave)-(\d+)$/;
const TIMESTAMPED_ITERATION_DIR_PATTERN = /^(\d{4})(\d{2})(\d{2})-(\d{6})(?:-(.+))?$/;
const ACTIVE_WAVE_PATH = 'work';
const ACTIVE_WAVE_MARKER = 'work/task-graph.md';
const ROOT_WAVE_MARKER = 'task-graph.md';
const ROOT_SEED_FILE = 'seed.md';
const ARCHIVE_ITERATIONS_DIR = `${WAVE_ARCHIVE_DIR}/iterations`;

const ACTIVE_WAVE_DIR = 'work';
const ACTIVE_WORK_FILENAMES = new Set(['task-graph.md', 'PRD.md', 'idea.md']);
const ITERATION_MARKER_FILENAMES = new Set([
  'task-graph.md',
  'PRD.md',
  'idea.md',
  'acceptance.md',
  'review.md',
  'manifest.md',
]);

interface ArchivedIterationCandidate {
  path: string;
  dirName: string;
  explicitNumber?: number;
  label?: string;
  archivedAt?: string;
  sortKey: string;
}

function isActiveWorkFile(entry: import('../fs/directoryReader').DirectoryEntry): boolean {
  if (entry.kind !== 'file') return false;
  if (entry.path.startsWith(`${WAVE_ARCHIVE_DIR}/`)) return false;
  return (
    ACTIVE_WORK_FILENAMES.has(entry.name) ||
    (entry.name.startsWith('execution-batch-') && entry.name.endsWith('.md'))
  );
}

/**
 * Archives the current active iteration by copying all files from `work/`
 * (excluding the archive directory itself) into `work/archive/iteration-{n}/`.
 *
 * Returns the archive path on success, or null if there was nothing to archive.
 */
export async function archiveActiveWave(
  adapter: FileSystemAdapter,
  files?: Map<string, string>
): Promise<string | null> {
  // Determine next archive number
  const existingArchives = await listArchivedIterationCandidates(adapter);
  const maxNum = assignIterationNumbers(existingArchives).maxNumber;
  const nextNum = maxNum + 1;
  const archivePath = `${ARCHIVE_ITERATIONS_DIR}/iteration-${nextNum}`;

  // Collect files to archive
  const filesToArchive: { path: string; content: string }[] = [];

  if (files) {
    // Use provided files (previous snapshot)
    for (const [path, content] of files) {
      if (path.startsWith(`${WAVE_ARCHIVE_DIR}/`)) continue;
      filesToArchive.push({ path, content });
    }
  } else {
    // Read current files from work/
    const workEntries = await adapter.readDirectoryRecursively(ACTIVE_WAVE_DIR);
    for (const entry of workEntries) {
      if (entry.kind !== 'file') continue;
      if (entry.path.startsWith(`${WAVE_ARCHIVE_DIR}/`)) continue;

      try {
        const content = await adapter.readFile(entry.path);
        filesToArchive.push({ path: entry.path, content });
      } catch {
        // Skip unreadable files
      }
    }

    try {
      const seed = await adapter.readFile(ROOT_SEED_FILE);
      filesToArchive.push({ path: ROOT_SEED_FILE, content: seed });
    } catch {
      // seed.md is optional for older projects
    }
  }

  if (filesToArchive.length === 0) {
    return null;
  }

  // Create archive directory and copy files
  await adapter.createDirectory(archivePath);

  for (const file of filesToArchive) {
    const relativePath = file.path.startsWith(`${ACTIVE_WAVE_DIR}/`)
      ? file.path.slice(ACTIVE_WAVE_DIR.length + 1)
      : file.path;
    const archiveFilePath = `${archivePath}/${relativePath}`;

    // Ensure parent directories exist
    const parts = archiveFilePath.split('/').filter(Boolean);
    let currentDir = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = currentDir ? `${currentDir}/${parts[i]}` : parts[i];
      try {
        await adapter.createDirectory(currentDir);
      } catch {
        // Directory may already exist
      }
    }

    await adapter.writeFile(archiveFilePath, file.content);
  }

  return archivePath;
}

/**
 * Scans a PraxisKit project directory for complete development iteration directories.
 *
 * Detects:
 * - The active iteration at `work/` (if `work/task-graph.md` exists)
 * - Archived iterations in child directories of `work/archive/iterations/`
 * - Archived iterations under `work/archive/iteration-{n}/`
 * - Legacy archived iterations under `work/archive/wave-{n}/`
 *
 * Returns sorted array: active iteration first, then archived iterations by number ascending.
 */
export async function scanWaves(adapter: FileSystemAdapter): Promise<WaveDescriptor[]> {
  const archivedCandidates = await listArchivedIterationCandidates(adapter);
  const numberedArchives = assignIterationNumbers(archivedCandidates);
  const archivedIterations: WaveDescriptor[] = numberedArchives.items.map(({ candidate, number }) => ({
    id: `iteration-${number}`,
    name: formatIterationName(number, candidate.label),
    path: candidate.path,
    isActive: false,
    archivedAt: candidate.archivedAt,
  }));

  const waves: WaveDescriptor[] = [];

  // Detect active iteration. Prefer the PraxisKit work/ directory, but keep a
  // root-level fallback for older single-wave projects.
  const hasActiveWave = await hasFile(adapter, ACTIVE_WAVE_MARKER) || await hasActiveWorkFiles(adapter);
  if (hasActiveWave) {
    const activeIterationNum = numberedArchives.maxNumber + 1;
    waves.push({
      id: `iteration-${activeIterationNum}`,
      name: `Iteration ${activeIterationNum} (Active)`,
      path: ACTIVE_WAVE_PATH,
      isActive: true,
    });
  } else if (await hasFile(adapter, ROOT_WAVE_MARKER)) {
    waves.push({
      id: 'iteration-1',
      name: 'Iteration 1 (Active)',
      path: '',
      isActive: true,
    });
  }

  waves.push(...archivedIterations);

  return waves;
}

async function listArchivedIterationCandidates(adapter: FileSystemAdapter): Promise<ArchivedIterationCandidate[]> {
  const candidates: ArchivedIterationCandidate[] = [];
  const archiveEntries = await safeListFiles(adapter, WAVE_ARCHIVE_DIR);

  for (const entry of archiveEntries) {
    if (entry.kind !== 'directory') continue;
    if (entry.name === 'iterations') continue;

    const match = ITERATION_DIR_PATTERN.exec(entry.name);
    if (!match) continue;

    const explicitNumber = parseInt(match[1], 10);
    const archivedAt = await getWaveArchiveDate(adapter, entry.path);
    candidates.push({
      path: entry.path,
      dirName: entry.name,
      explicitNumber,
      archivedAt,
      sortKey: `numbered-${String(explicitNumber).padStart(6, '0')}`,
    });
  }

  const nestedIterationEntries = await safeListFiles(adapter, ARCHIVE_ITERATIONS_DIR);
  for (const entry of nestedIterationEntries) {
    if (entry.kind !== 'directory') continue;
    if (!(await hasIterationMarkerFile(adapter, entry.path))) continue;

    const timestamp = parseTimestampedIterationDir(entry.name);
    const archivedAt = timestamp?.archivedAt ?? await getWaveArchiveDate(adapter, entry.path);
    candidates.push({
      path: entry.path,
      dirName: entry.name,
      label: timestamp?.label,
      archivedAt,
      sortKey: timestamp?.sortKey ?? `nested-${entry.name}`,
    });
  }

  if (await hasFlatArchivedIteration(adapter)) {
    candidates.push({
      path: WAVE_ARCHIVE_DIR,
      dirName: 'archive',
      label: 'legacy flat archive',
      archivedAt: await getWaveArchiveDate(adapter, WAVE_ARCHIVE_DIR),
      sortKey: 'flat-archive',
    });
  }

  candidates.sort((a, b) => a.sortKey.localeCompare(b.sortKey, undefined, { numeric: true }));
  return candidates;
}

function assignIterationNumbers(candidates: ArchivedIterationCandidate[]): {
  items: { candidate: ArchivedIterationCandidate; number: number }[];
  maxNumber: number;
} {
  const used = new Set<number>();
  const items: { candidate: ArchivedIterationCandidate; number: number }[] = [];
  let nextNumber = 1;

  for (const candidate of candidates) {
    let number = candidate.explicitNumber;
    if (!number || used.has(number)) {
      while (used.has(nextNumber)) {
        nextNumber++;
      }
      number = nextNumber;
    }
    used.add(number);
    items.push({ candidate, number });
  }

  const maxNumber = Math.max(0, ...Array.from(used));
  items.sort((a, b) => a.number - b.number);
  return { items, maxNumber };
}

function formatIterationName(number: number, label?: string): string {
  if (!label) return `Iteration ${number}`;
  return `Iteration ${number}: ${label.replace(/[-_]+/g, ' ')}`;
}

function parseTimestampedIterationDir(dirName: string): { archivedAt: string; label?: string; sortKey: string } | null {
  const match = TIMESTAMPED_ITERATION_DIR_PATTERN.exec(dirName);
  if (!match) return null;

  const [, year, month, day, time, rawLabel] = match;
  return {
    archivedAt: `${year}-${month}-${day}`,
    label: rawLabel,
    sortKey: `timestamp-${year}${month}${day}-${time}`,
  };
}

async function getWaveArchiveDate(adapter: FileSystemAdapter, wavePath: string): Promise<string | undefined> {
  try {
    const files = (await adapter.readDirectoryRecursively(wavePath)).filter((entry) => entry.kind === 'file');
    let latest: number | null = null;
    for (const file of files) {
      const meta = await adapter.getFileMetadata(file.path);
      latest = latest === null ? meta.lastModified : Math.max(latest, meta.lastModified);
    }
    return latest === null ? undefined : new Date(latest).toISOString().split('T')[0];
  } catch {
    // Fall back to representative files for adapters that cannot recurse here.
  }

  const candidateFiles = ['acceptance.md', 'build-log-1.md', 'task-graph.md', 'PRD.md'];
  for (const file of candidateFiles) {
    try {
      const meta = await adapter.getFileMetadata(`${wavePath}/${file}`);
      return new Date(meta.lastModified).toISOString().split('T')[0];
    } catch {
      continue;
    }
  }
  return undefined;
}

async function hasFile(adapter: FileSystemAdapter, path: string): Promise<boolean> {
  try {
    await adapter.readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function hasActiveWorkFiles(adapter: FileSystemAdapter): Promise<boolean> {
  const entries = await safeReadDirectoryRecursively(adapter, ACTIVE_WAVE_DIR);
  return entries.some(isActiveWorkFile);
}

async function hasIterationMarkerFile(adapter: FileSystemAdapter, dirPath: string): Promise<boolean> {
  const entries = await safeReadDirectoryRecursively(adapter, dirPath);
  return entries.some((entry) => {
    if (entry.kind !== 'file') return false;
    return ITERATION_MARKER_FILENAMES.has(entry.name) ||
      (entry.name.startsWith('execution-batch-') && entry.name.endsWith('.md'));
  });
}

async function hasFlatArchivedIteration(adapter: FileSystemAdapter): Promise<boolean> {
  const entries = await safeListFiles(adapter, WAVE_ARCHIVE_DIR);
  return entries.some((entry) => {
    if (entry.kind !== 'file') return false;
    return ITERATION_MARKER_FILENAMES.has(entry.name) ||
      (entry.name.startsWith('execution-batch-') && entry.name.endsWith('.md'));
  });
}

async function safeListFiles(adapter: FileSystemAdapter, dirPath: string): Promise<DirectoryEntry[]> {
  try {
    return await adapter.listFiles(dirPath);
  } catch {
    return [];
  }
}

async function safeReadDirectoryRecursively(adapter: FileSystemAdapter, dirPath: string): Promise<DirectoryEntry[]> {
  try {
    return await adapter.readDirectoryRecursively(dirPath);
  } catch {
    return [];
  }
}
