import type { FileSystemAdapter } from '@/fs/directoryReader';
import type { ParseResult, ParseError } from './types';
import { parseTaskGraph } from './taskGraphParser';
import { parseBatch } from './batchParser';
import { parsePRD } from './prdParser';
import { WAVE_ARCHIVE_DIR } from './types';

function normalizePath(path: string): string {
  return path.replace(/^\/+|\/+$/g, '');
}

function isArchivedPath(path: string): boolean {
  return path === WAVE_ARCHIVE_DIR || path.startsWith(`${WAVE_ARCHIVE_DIR}/`);
}

export async function parseWave(
  adapter: FileSystemAdapter,
  wavePath: string
): Promise<ParseResult> {
  const errors: ParseError[] = [];
  const tasks: ParseResult['tasks'] = [];
  const batches: ParseResult['batches'] = [];
  let functionalRequirements: ParseResult['functionalRequirements'] = [];

  const meta: ParseResult['meta'] = {
    name: adapter.getRootName(),
  };

  const normalizedWavePath = normalizePath(wavePath);
  const entries = await adapter.readDirectoryRecursively(normalizedWavePath);
  const files = entries.filter((e) => e.kind === 'file');

  const prefix = normalizedWavePath ? `${normalizedWavePath}/` : '';

  for (const file of files) {
    if (isArchivedPath(file.path) && normalizedWavePath !== WAVE_ARCHIVE_DIR && !normalizedWavePath.startsWith(`${WAVE_ARCHIVE_DIR}/`)) {
      continue;
    }

    const isInWave = normalizedWavePath === ''
      ? true
      : file.path.startsWith(prefix);

    if (!isInWave) {
      continue;
    }

    if (file.name === 'task-graph.md') {
      try {
        const content = await adapter.readFile(file.path);
        const result = parseTaskGraph(content, file.path);
        tasks.push(...result.tasks);
        errors.push(...result.errors);
      } catch (err) {
        errors.push({ file: file.path, message: String(err) });
      }
    }

    if (file.name.startsWith('execution-batch-') && file.name.endsWith('.md')) {
      try {
        const content = await adapter.readFile(file.path);
        const result = parseBatch(content, file.name);
        if (result.batch) {
          batches.push(result.batch);
        }
        errors.push(...result.errors);
      } catch (err) {
        errors.push({ file: file.path, message: String(err) });
      }
    }

    if (file.name === 'idea.md') {
      try {
        const content = await adapter.readFile(file.path);
        const match = content.match(/#\s*Idea Brief:\s*(.+)(?:\n|$)/);
        if (match) {
          meta.ideaSummary = match[1].trim();
        }
      } catch {
        // ignore
      }
    }

    if (file.name === 'PRD.md') {
      try {
        const content = await adapter.readFile(file.path);
        const match = content.match(/#\s*PRD:\s*(.+)(?:\n|$)/);
        if (match) {
          meta.prdSummary = match[1].trim();
        }
        const prdResult = parsePRD(content, file.path);
        functionalRequirements = prdResult.functionalRequirements;
        errors.push(...prdResult.errors);
      } catch {
        // ignore
      }
    }
  }

  batches.sort((a, b) => a.id - b.id);

  return { tasks, batches, meta, errors, functionalRequirements };
}
