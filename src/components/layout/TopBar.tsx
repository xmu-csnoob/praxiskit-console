import { PanelLeft, PanelRightClose } from 'lucide-react';
import { WaveSelector } from '@/components/wave-selector';

interface TopBarProps {
  projectName?: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  hasMultipleWaves?: boolean;
}

export function TopBar({
  projectName,
  sidebarOpen,
  onToggleSidebar,
  hasMultipleWaves,
}: TopBarProps) {
  return (
    <header className="h-12 border-b border-border bg-background flex items-center px-4 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-md hover:bg-accent transition-colors mr-3"
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? (
          <PanelRightClose className="w-4 h-4 text-muted-foreground" />
        ) : (
          <PanelLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm font-semibold text-foreground">
          PraxisKit Visual Workbench
        </span>
        {projectName && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {projectName}
            </span>
          </>
        )}
      </div>

      {hasMultipleWaves && (
        <div className="ml-4 shrink-0">
          <WaveSelector />
        </div>
      )}
    </header>
  );
}
