import { cn } from '@/lib/utils';
import { GitGraph, LayoutDashboard, FileText } from 'lucide-react';

export type ViewType = 'dag' | 'overview' | 'prd';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const views: { id: ViewType; label: string; icon: typeof GitGraph }[] = [
  { id: 'dag', label: 'DAG', icon: GitGraph },
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'prd', label: 'PRD Map', icon: FileText },
];

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
        Views
      </span>
      {views.map((view) => {
        const Icon = view.icon;
        const active = currentView === view.id;
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
              active
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
