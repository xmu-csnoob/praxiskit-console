import { useEffect, useRef, useState, useCallback } from 'react';
import type { FileSystemAdapter } from '@/fs/directoryReader';
import { readKeyFiles, createFingerprint } from '@/cache/fingerprint';

interface FileWatcherState {
  isWatching: boolean;
  lastChecked: number | null;
  changedFiles: string[];
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
