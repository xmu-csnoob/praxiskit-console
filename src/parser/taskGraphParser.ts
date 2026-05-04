import type { ParsedTask, ParseError } from './types';

function parseStatus(statusStr: string): ParsedTask['status'] {
  const s = statusStr.trim();
  if (s === '[x]') return 'completed';
  if (s === '[/]') return 'in-progress';
  if (s === '[!]') return 'blocked';
  return 'pending';
}

function parseDependencies(depsStr: string): string[] {
  const s = depsStr.trim();
  if (s === '—' || s === '-' || s === '' || s === '[]') return [];
  // Handle bracketed format like [T1.1, T1.2]
  const cleaned = s.replace(/^\[(.*)\]$/, '$1');
  if (!cleaned.trim()) return [];
  return cleaned.split(',').map((d) => d.trim()).filter(Boolean);
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim();
  const withoutLeadingPipe = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const withoutTrailingPipe = withoutLeadingPipe.endsWith('|')
    ? withoutLeadingPipe.slice(0, -1)
    : withoutLeadingPipe;
  return withoutTrailingPipe.split('|').map((p) => p.trim());
}

function isSeparatorRow(parts: string[]): boolean {
  return parts.length > 0 && parts.every((part) => /^:?-{3,}:?$/.test(part));
}

function isTaskTableHeader(parts: string[]): boolean {
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

export function parseTaskGraph(content: string, filename: string): { tasks: ParsedTask[]; errors: ParseError[] } {
  const tasks: ParsedTask[] = [];
  const errors: ParseError[] = [];
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

    const taskId = parts[0];
    if (!taskId?.match(/^T\d+\.\d+$/)) {
      continue;
    }

    if (parts.length < 6) {
      errors.push({ file: filename, message: `Malformed task row at line ${i + 1}`, line: i + 1 });
      continue;
    }

    const [id, title, statusStr, acceptanceCriteria, writeScope, depsStr] = parts;

    tasks.push({
      id,
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
