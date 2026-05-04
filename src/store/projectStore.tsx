import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { ParseResult, ParsedWave } from '@/parser/types';
import type { FileSystemAdapter } from '@/fs/directoryReader';

interface ProjectState {
  parseResult: ParseResult | null;
  waves: ParsedWave[];
  currentWaveIndex: number;
  isLoading: boolean;
  error: string | null;
  adapter: FileSystemAdapter | null;
}

interface ProjectContextValue {
  state: ProjectState;
  loadProject: (adapter: FileSystemAdapter) => Promise<void>;
  clearError: () => void;
  setCurrentWave: (index: number) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProjectState>({
    parseResult: null,
    waves: [],
    currentWaveIndex: -1,
    isLoading: false,
    error: null,
    adapter: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const loadProject = useCallback(async (adapter: FileSystemAdapter) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, isLoading: true, error: null, adapter }));

    try {
      const { parseProject } = await import('@/parser/projectParser');
      if (controller.signal.aborted) return;

      const parseResult = await parseProject(adapter);
      if (controller.signal.aborted) return;

      const waves = parseResult.waves ?? [];

      setState((prev) => {
        // Preserve user's wave selection across reloads when possible.
        const prevWave = prev.waves[prev.currentWaveIndex];
        const matchedIndex = prevWave && !prevWave.isActive
          ? waves.findIndex((w) => w.id === prevWave.id)
          : -1;
        const activeIndex = waves.findIndex((w) => w.isActive);
        const currentWaveIndex =
          matchedIndex >= 0 ? matchedIndex : activeIndex >= 0 ? activeIndex : waves.length > 0 ? 0 : -1;
        const currentParseResult = currentWaveIndex >= 0 ? waves[currentWaveIndex].parseResult : parseResult;

        return {
          parseResult: currentParseResult,
          waves,
          currentWaveIndex,
          isLoading: false,
          error: null,
          adapter,
        };
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load project',
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const setCurrentWave = useCallback((index: number) => {
    setState((prev) => {
      if (index < 0 || index >= prev.waves.length) return prev;
      return {
        ...prev,
        currentWaveIndex: index,
        parseResult: prev.waves[index].parseResult,
      };
    });
  }, []);

  return (
    <ProjectContext.Provider value={{ state, loadProject, clearError, setCurrentWave }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectStore(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProjectStore must be used within ProjectProvider');
  }
  return ctx;
}
