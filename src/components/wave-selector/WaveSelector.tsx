import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Archive, Zap } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import type { ParsedWave } from '@/parser/types';

function getWaveCompletion(wave: ParsedWave): { total: number; completed: number } {
  const tasks = wave.parseResult.tasks;
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return { total, completed };
}

function WaveItem({
  wave,
  isSelected,
  isActive,
  onSelect,
  itemRef,
}: {
  wave: ParsedWave;
  isSelected: boolean;
  isActive: boolean;
  onSelect: () => void;
  itemRef?: React.Ref<HTMLButtonElement>;
}) {
  const { total, completed } = getWaveCompletion(wave);

  return (
    <button
      ref={itemRef}
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
      className={
        'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer ' +
        (isSelected
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50 text-foreground')
      }
    >
      <div className="flex items-center gap-2 min-w-0">
        {isActive ? (
          <Zap className="w-3.5 h-3.5 shrink-0 text-amber-500" />
        ) : (
          <Archive className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{wave.name}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2">
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {completed}/{total}
          </span>
        )}
        {!isActive && wave.archivedAt && (
          <span className="text-[10px] text-muted-foreground">
            {wave.archivedAt}
          </span>
        )}
        {isActive && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Active
          </span>
        )}
        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
      </div>
    </button>
  );
}

export function WaveSelector() {
  const { state, setCurrentWave } = useProjectStore();
  const { waves, currentWaveIndex } = state;
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(currentWaveIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentWave = waves[currentWaveIndex];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setHighlightedIndex(currentWaveIndex);
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev + 1) % waves.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev - 1 + waves.length) % waves.length);
          break;
        case 'Enter':
        case ' ': {
          e.preventDefault();
          const wave = waves[highlightedIndex];
          if (wave) {
            setCurrentWave(highlightedIndex);
            setOpen(false);
          }
          break;
        }
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
        case 'Tab':
          setOpen(false);
          break;
      }
    },
    [open, waves, highlightedIndex, setCurrentWave, currentWaveIndex]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (open && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  if (waves.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => {
          setHighlightedIndex(currentWaveIndex);
          setOpen(!open);
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select iteration"
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors min-w-[140px]"
      >
        {currentWave?.isActive ? (
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        ) : (
          <Archive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="truncate">{currentWave?.name ?? 'Select iteration'}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground shrink-0 ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Iterations"
          className="absolute top-full left-0 mt-1 w-64 max-h-72 overflow-y-auto rounded-md border border-border bg-popover shadow-lg z-50 py-1"
        >
          {waves.map((wave, index) => (
            <WaveItem
              key={wave.id}
              wave={wave}
              isSelected={index === highlightedIndex}
              isActive={wave.isActive}
              onSelect={() => {
                setCurrentWave(index);
                setOpen(false);
              }}
              itemRef={(el) => { itemRefs.current[index] = el; }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
