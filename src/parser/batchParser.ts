import type { ParsedBatch, ParsedBatchTask, ParseError } from './types';

function extractMetadataValue(content: string, key: string): string | undefined {
  const regex = new RegExp(`^\\s*[-*]?\\s*\\*{0,2}${key}\\*{0,2}\\s*:\\s*(.+)$`, 'im');
  const match = content.match(regex);
  return match ? match[1].trim() : undefined;
}

function extractSection(content: string, heading: string): string | undefined {
  const lines = content.split('\n');
  const startRegex = new RegExp(`^#{2,6}\\s+${heading}\\s*$`, 'i');
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

function extractSectionValue(content: string, heading: string, key: string): string | undefined {
  const section = extractSection(content, heading);
  return section ? extractMetadataValue(section, key) : undefined;
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

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim();
}

function getColumnIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

function parseDependencies(depsStr: string): string[] {
  const s = depsStr.trim();
  if (s === '—' || s === '-' || s === '' || s === '[]') return [];
  return s.match(/T\d+\.\d+/g) ?? [];
}

function parseAuthorization(content: string): ParsedBatch['authorization'] {
  const authRaw =
    extractMetadataValue(content, 'Authorization') ??
    extractSectionValue(content, 'Authorization', 'Mode') ??
    'dry-run';
  return authRaw.toLowerCase().includes('execute') ? 'execute' : 'dry-run';
}

function parseBaselineStatus(content: string): string {
  const baselineRaw =
    extractMetadataValue(content, 'Baseline status') ??
    extractSectionValue(content, 'Baseline', 'Status') ??
    'unavailable';
  return baselineRaw.split(/\s+/)[0].toLowerCase();
}

export function parseBatch(content: string, filename: string): { batch: ParsedBatch | null; errors: ParseError[] } {
  const errors: ParseError[] = [];

  const idMatch = filename.match(/execution-batch-(\d+)\.md$/);
  const id = idMatch ? parseInt(idMatch[1], 10) : 0;

  const authorization = parseAuthorization(content);
  const baselineStatus = parseBaselineStatus(content);

  const tasks: ParsedBatchTask[] = [];
  const lines = content.split('\n');

  let inSelectedTasks = false;
  let headers: string[] | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('## Selected Tasks')) {
      inSelectedTasks = true;
      headers = null;
      continue;
    }
    if (inSelectedTasks && line.startsWith('## ')) {
      break;
    }

    if (!inSelectedTasks || !line.trim().startsWith('|')) continue;

    const parts = splitTableRow(line);
    if (isSeparatorRow(parts)) continue;

    const normalized = parts.map(normalizeHeader);
    if (normalized.includes('id') && normalized.includes('title')) {
      headers = normalized;
      continue;
    }

    if (!headers || parts.length < 2) continue;

    const idIndex = getColumnIndex(headers, ['id']);
    const titleIndex = getColumnIndex(headers, ['title']);
    const statusIndex = getColumnIndex(headers, ['status at selection', 'status at batch', 'status']);
    const depsIndex = getColumnIndex(headers, ['dependencies']);
    const writeScopeIndex = getColumnIndex(headers, ['write scope']);

    const taskId = parts[idIndex] ?? '';
    if (!taskId.match(/^T\d+\.\d+$/)) continue;

    const title = parts[titleIndex] ?? '';
    const statusAtSelection = statusIndex >= 0 ? parts[statusIndex] ?? '' : '';
    const depsStr = depsIndex >= 0 ? parts[depsIndex] ?? '' : '';
    const writeScope = writeScopeIndex >= 0 ? parts[writeScopeIndex] ?? '' : '';

    tasks.push({
      id: taskId,
      title,
      statusAtSelection: statusAtSelection.trim(),
      dependencies: parseDependencies(depsStr),
      writeScope,
    });
  }

  return {
    batch: { id, tasks, authorization, baselineStatus },
    errors,
  };
}
