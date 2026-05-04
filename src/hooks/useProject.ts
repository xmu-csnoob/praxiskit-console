import { useCallback } from 'react';
import { useProjectStore } from '@/store';
import { openDirectoryPicker, createFileSystemAdapter } from '@/fs/fileAccess';

export function useProject() {
  const { state, loadProject, clearError, setCurrentWave } = useProjectStore();

  const pickAndLoadProject = useCallback(async () => {
    const handle = await openDirectoryPicker();
    if (!handle) {
      return;
    }
    const adapter = createFileSystemAdapter(handle);
    await loadProject(adapter);
  }, [loadProject]);

  const reloadProject = useCallback(async () => {
    if (!state.adapter) return;
    await loadProject(state.adapter);
  }, [loadProject, state.adapter]);

  return {
    state,
    loadProject: pickAndLoadProject,
    reloadProject,
    clearError,
    setCurrentWave,
  };
}
