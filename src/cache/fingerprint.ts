import type { FileSystemAdapter } from '@/fs/directoryReader';

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return String(hash);
}

export async function readKeyFiles(adapter: FileSystemAdapter): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const entries = await adapter.readDirectoryRecursively('work');

  for (const entry of entries) {
    if (entry.kind !== 'file') continue;
    if (entry.path.startsWith('work/archive/')) continue;
    if (!entry.name.endsWith('.md')) continue;
    try {
      const content = await adapter.readFile(entry.path);
      files.set(entry.path, content);
    } catch {
      // skip unreadable files
    }
  }

  try {
    files.set('seed.md', await adapter.readFile('seed.md'));
  } catch {
    // seed.md is optional
  }

  return files;
}

export function createFingerprint(files: Map<string, string>): string {
  const entries = Array.from(files.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return hashString(entries.map(([path, content]) => `${path}:${hashString(content)}`).join('|'));
}
