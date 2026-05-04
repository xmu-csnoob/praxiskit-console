import { useEffect, useRef, useState, useCallback } from 'react';
import type { FileSystemAdapter } from '@/fs/directoryReader';

interface FileWatcherState {
  isWatching: boolean;
  lastChecked: number | null;
  changedFiles: string[];
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return String(hash);
}

function createFingerprint(files: Map<string, string>): string {
  const entries = Array.from(files.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return hashString(entries.map(([path, content]) => `${path}:${hashString(content)}`).join('|'));
}

function diffFiles(previous: Map<string, string>, current: Map<string, string>): string[] {
  const paths = new Set([...previous.keys(), ...current.keys()]);
  const changed: string[] = [];
  for (const path of paths) {
    if (previous.get(path) !== current.get(path)) {
      changed.push(path);
    }
  }
  return changed.sort((a, b) => a.localeCompare(b));
}

async function readKeyFiles(adapter: FileSystemAdapter): Promise<Map<string, string>> {
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

export function useFileWatcher(
  adapter: FileSystemAdapter | null,
  onChange: (changedFiles: string[], previousFiles: Map<string, string>) => void | Promise<void>,
  intervalMs: number = 5000
): FileWatcherState {
  const [state, setState] = useState<FileWatcherState>({
    isWatching: false,
    lastChecked: null,
    changedFiles: [],
  });
  const fingerprintRef = useRef<string | null>(null);
  const filesRef = useRef<Map<string, string> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkingRef = useRef(false);

  const check = useCallback(async () => {
    if (!adapter) return;
    if (checkingRef.current) return;

    checkingRef.current = true;
    try {
      const files = await readKeyFiles(adapter);
      const fingerprint = createFingerprint(files);
      const previous = fingerprintRef.current;
      const previousFiles = filesRef.current;

      if (previous !== null && previous !== fingerprint && previousFiles) {
        const changedFiles = diffFiles(previousFiles, files);
        await onChange(changedFiles, previousFiles);
        setState((s) => ({
          ...s,
          lastChecked: Date.now(),
          changedFiles,
        }));
      } else {
        setState((s) => ({
          ...s,
          lastChecked: Date.now(),
          changedFiles: [],
        }));
      }

      fingerprintRef.current = fingerprint;
      filesRef.current = files;
    } catch {
      setState((s) => ({ ...s, lastChecked: Date.now() }));
    } finally {
      checkingRef.current = false;
    }
  }, [adapter, onChange]);

  useEffect(() => {
    if (!adapter) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      fingerprintRef.current = null;
      filesRef.current = null;
      queueMicrotask(() => {
        setState({ isWatching: false, lastChecked: null, changedFiles: [] });
      });
      return;
    }

    // Initial check
    check();
    queueMicrotask(() => {
      setState((s) => ({ ...s, isWatching: true }));
    });

    timerRef.current = setInterval(check, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [adapter, intervalMs, check]);

  return state;
}
