import { PanelLeft, PanelRightClose, Languages } from 'lucide-react';
import { WaveSelector } from '@/components/wave-selector';
import { useLanguage } from '@/store';

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
  const { lang, toggle } = useLanguage();

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

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggle}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-accent transition-colors"
          title="Toggle language"
        >
          <Languages className="w-3.5 h-3.5" />
          <span className="font-medium">{lang === 'zh' ? '中文' : 'EN'}</span>
        </button>

        {hasMultipleWaves && (
          <div className="ml-2">
            <WaveSelector />
          </div>
        )}
      </div>
    </header>
  );
}
