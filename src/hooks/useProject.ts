import { useCallback, useEffect, useRef } from 'react';
import { useProjectStore } from '@/store';
import {
  openDirectoryPicker,
  createFileSystemAdapter,
  saveDirectoryHandle,
  restoreDirectoryHandle,
  verifyPermission,
} from '@/fs/fileAccess';

export function useProject() {
  const { state, loadProject, clearError, setCurrentWave } = useProjectStore();
  const restoredRef = useRef(false);

  // Auto-restore last directory handle on first mount.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    async function autoRestore() {
      const handle = await restoreDirectoryHandle();
      if (!handle) return;
      const ok = await verifyPermission(handle);
      if (!ok) return;
      const adapter = createFileSystemAdapter(handle);
      await loadProject(adapter);
    }
    autoRestore();
  }, [loadProject]);

  const pickAndLoadProject = useCallback(async () => {
    const handle = await openDirectoryPicker();
    if (!handle) {
      return;
    }
    const adapter = createFileSystemAdapter(handle);
    await loadProject(adapter);
    await saveDirectoryHandle(handle);
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
