import { useState, useEffect, type ReactNode } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import type { ViewType } from './ViewSwitcher';
import { useProjectStore } from '@/store/projectStore';

interface AppShellProps {
  projectName?: string;
  children?: ReactNode;
  onSelectProject?: () => void;
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function AppShell({
  projectName,
  children,
  onSelectProject,
  currentView: controlledView,
  onViewChange,
}: AppShellProps) {
  const isTablet = useMediaQuery('(max-width: 1023px)');
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [sidebarOverride, setSidebarOverride] = useState<boolean | null>(null);
  const [internalView, setInternalView] = useState<ViewType>('dag');

  const currentView = controlledView ?? internalView;
  const setCurrentView = onViewChange ?? setInternalView;
  const sidebarOpen = sidebarOverride ?? !isTablet;

  const { state } = useProjectStore();
  const hasMultipleWaves = state.waves.length > 1 || state.waves.some((wave) => !wave.isActive);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <TopBar
        projectName={projectName}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOverride(!sidebarOpen)}
        hasMultipleWaves={hasMultipleWaves}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          open={sidebarOpen}
          collapsed={isMobile}
          projectName={projectName}
          currentView={currentView}
          onViewChange={setCurrentView}
          onSelectProject={onSelectProject}
        />

        {isMobile && sidebarOpen && (
          <div
            className="absolute inset-0 bg-black/20 z-20"
            onClick={() => setSidebarOverride(false)}
          />
        )}

        <main className="flex-1 overflow-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export type { ViewType };
