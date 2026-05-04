import { cn } from '@/lib/utils';
import { FolderOpen, GitGraph, LayoutDashboard } from 'lucide-react';
import type { ViewType } from './ViewSwitcher';

interface SidebarProps {
  open: boolean;
  collapsed?: boolean;
  projectName?: string;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onSelectProject?: () => void;
}

const views: { id: ViewType; label: string; icon: typeof GitGraph }[] = [
  { id: 'dag', label: 'DAG', icon: GitGraph },
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
];

export function Sidebar({
  open,
  collapsed,
  projectName,
  currentView,
  onViewChange,
  onSelectProject,
}: SidebarProps) {
  // Mobile collapsed mode: show icon bar when sidebar is "closed"
  const iconBarMode = collapsed && !open;

  return (
    <aside
      className={cn(
        'h-full bg-background border-r border-border flex flex-col transition-all duration-200 shrink-0',
        iconBarMode
          ? 'w-12'
          : open
            ? 'w-56'
            : 'w-0 overflow-hidden'
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-4 overflow-y-auto overflow-x-hidden',
          iconBarMode ? 'p-1.5 items-center' : 'p-3'
        )}
      >
        {/* Project Selector */}
        <div className={cn(iconBarMode && 'flex flex-col items-center')}>
          {!iconBarMode && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 block mb-1.5">
              Project
            </span>
          )}
          <button
            onClick={onSelectProject}
            title={projectName || 'Select project folder'}
            className={cn(
              'flex items-center rounded-md border border-dashed border-border',
              'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
              iconBarMode
                ? 'w-9 h-9 justify-center p-0'
                : 'gap-2 w-full px-2 py-2 text-sm'
            )}
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            {!iconBarMode && (
              <span className="truncate">{projectName || 'Select project folder'}</span>
            )}
          </button>
        </div>

        {/* View Switcher */}
        <div className={cn('flex flex-col', iconBarMode ? 'gap-1.5 items-center' : 'gap-0.5')}>
          {!iconBarMode && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
              Views
            </span>
          )}
          {views.map((view) => {
            const Icon = view.icon;
            const active = currentView === view.id;
            return (
              <button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                title={view.label}
                className={cn(
                  'flex items-center rounded-md transition-colors',
                  iconBarMode
                    ? 'w-9 h-9 justify-center p-0'
                    : 'gap-2 px-2 py-1.5 text-sm',
                  active
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!iconBarMode && <span>{view.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
