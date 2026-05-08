import { memo, useState, useMemo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { DagNodeData } from '../flowConfig';
import { useLanguage } from '@/store';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  FileCode2,
} from 'lucide-react';

interface TaskNodeData extends DagNodeData {
  priority?: 'Must' | 'Should' | 'Could';
  taskId?: string;
  description?: string;
  descriptionCn?: string;
  descriptionEn?: string;
  writeScope?: string;
}

type TaskNodeType = Node<TaskNodeData>;

/* ── i18n labels ── */
const t = {
  status: {
    pending: { en: 'Pending', zh: '待处理' },
    'in-progress': { en: 'In Progress', zh: '进行中' },
    completed: { en: 'Completed', zh: '已完成' },
    blocked: { en: 'Blocked', zh: '已阻塞' },
  },
  cp: { en: 'CP', zh: '关键路径' },
  writeScope: { en: 'Write Scope', zh: '写入范围' },
  acceptanceCriteria: { en: 'Acceptance Criteria', zh: '验收标准' },
} as const;

type StatusKey = 'pending' | 'in-progress' | 'completed' | 'blocked';
type AcKeyword = 'given' | 'when' | 'then' | 'and' | 'but';

const statusConfig: Record<
  StatusKey,
  {
    icon: typeof Circle;
    accentVar: string;
    dotColor: string;
    badgeColor: string;
  }
> = {
  pending: {
    icon: Circle,
    accentVar: 'var(--dag-status-pending)',
    dotColor: 'bg-[hsl(215_14%_60%)]',
    badgeColor: 'text-[hsl(215_14%_45%)] border-[hsl(215_14%_60%/0.35)]',
  },
  'in-progress': {
    icon: Clock,
    accentVar: 'var(--dag-status-active)',
    dotColor: 'bg-[hsl(217_91%_60%)]',
    badgeColor: 'text-[hsl(217_91%_45%)] border-[hsl(217_91%_60%/0.35)]',
  },
  completed: {
    icon: CheckCircle2,
    accentVar: 'var(--dag-status-done)',
    dotColor: 'bg-[hsl(142_71%_45%)]',
    badgeColor: 'text-[hsl(142_71%_35%)] border-[hsl(142_71%_45%/0.35)]',
  },
  blocked: {
    icon: AlertCircle,
    accentVar: 'var(--dag-status-blocked)',
    dotColor: 'bg-[hsl(0_84%_60%)]',
    badgeColor: 'text-[hsl(0_84%_45%)] border-[hsl(0_84%_60%/0.35)]',
  },
};

/* ── helpers ── */

interface AcPart {
  keyword: AcKeyword | null;
  text: string;
}

function parseAcceptanceCriteria(text: string): AcPart[] {
  const parts: AcPart[] = [];
  const regex = /\b(Given|When|Then|And|But)\b/gi;
  let lastIndex = 0;
  let lastKeyword: AcKeyword | null = null;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const keyword = match[1].toLowerCase() as AcKeyword;
    const start = match.index;

    if (lastKeyword !== null) {
      const prevText = text.slice(lastIndex, start).trim().replace(/[,;]$/, '');
      if (prevText) {
        parts.push({ keyword: lastKeyword, text: prevText });
      }
    } else if (start > 0) {
      const lead = text.slice(0, start).trim();
      if (lead) parts.push({ keyword: null, text: lead });
    }

    lastKeyword = keyword;
    lastIndex = regex.lastIndex;
  }

  if (lastKeyword !== null) {
    const tail = text.slice(lastIndex).trim().replace(/[,;]$/, '');
    if (tail) parts.push({ keyword: lastKeyword, text: tail });
  } else {
    if (text.trim()) parts.push({ keyword: null, text: text.trim() });
  }

  return parts;
}

function highlightInlineCode(text: string): React.ReactNode {
  const segments = text.split(/(`[^`]+`)/g);
  return segments.map((seg, i) => {
    if (seg.startsWith('`') && seg.endsWith('`')) {
      const code = seg.slice(1, -1);
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-black/5 font-mono text-[11px] text-foreground/80"
        >
          {code}
        </code>
      );
    }
    return <span key={i}>{seg}</span>;
  });
}

function AcLine({ part }: { part: AcPart }) {
  if (!part.keyword) {
    return (
      <p className="text-xs text-muted-foreground leading-relaxed">
        {highlightInlineCode(part.text)}
      </p>
    );
  }
  return (
    <div className="flex items-start gap-1.5">
      <span className="inline-flex items-center shrink-0 mt-0.5 text-[10px] px-1.5 py-0.5 rounded border font-medium leading-none text-slate-600 bg-slate-50 border-slate-200">
        {part.keyword.charAt(0).toUpperCase() + part.keyword.slice(1)}
      </span>
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">
        {highlightInlineCode(part.text)}
      </p>
    </div>
  );
}

/* ── component ── */

function TaskNodeComponent({ data }: NodeProps<TaskNodeType>) {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLanguage();
  const status = data.status as StatusKey;
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const isCritical = data.isCriticalPath ?? false;
  const parallelLevel = data.parallelLevel ?? 0;

  const displayLabel = lang === 'zh' && data.labelCn ? data.labelCn : data.labelEn || data.label;
  const displayDescription = lang === 'zh' && data.descriptionCn
    ? data.descriptionCn
    : data.descriptionEn || data.description;

  const acParts = useMemo(() => {
    if (!displayDescription) return [];
    return parseAcceptanceCriteria(displayDescription);
  }, [displayDescription]);

  const hasWriteScope = !!data.writeScope && data.writeScope !== '—' && data.writeScope !== '-';

  return (
    <div
      className={cn(
        'group relative w-[240px] rounded-xl border',
        'bg-[var(--dag-node-bg)] border-[var(--dag-node-border)]',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
        'transition-all duration-200',
        'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px',
        isCritical && 'ring-2 ring-amber-400/50',
        expanded && 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
      )}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 inset-y-0 w-1 rounded-l-xl"
        style={{ background: config.accentVar }}
      />

      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !border-2 !border-background opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ background: config.accentVar }}
      />

      <div className="p-4 pl-5">
        {/* Title row */}
        <div className="flex items-start gap-2">
          <div className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-0.5', config.dotColor)} />
          <span
            className="font-medium text-sm text-foreground flex-1 leading-snug line-clamp-2"
            title={data.label}
          >
            {displayLabel}
          </span>
          <span
            className="text-[9px] font-mono text-muted-foreground/40 tabular-nums shrink-0 mt-0.5 mr-0.5"
            title={`Wave ${data.wave} · Level ${parallelLevel}`}
          >
            W{data.wave}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-black/5 transition-colors shrink-0 -mt-0.5"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium',
              'bg-transparent border',
              config.badgeColor
            )}
            title={t.status[status].en}
          >
            <StatusIcon className="w-3 h-3" />
            {t.status[status][lang]}
          </span>
          {isCritical && (
            <span
              className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200"
              title={t.cp.en}
            >
              {t.cp.zh}
            </span>
          )}
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-black/8 space-y-2.5">
            {/* Acceptance Criteria */}
            {acParts.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                  {t.acceptanceCriteria.zh}
                  <span className="ml-1 font-normal normal-case">/ {t.acceptanceCriteria.en}</span>
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {acParts.map((part, i) => (
                    <AcLine key={i} part={part} />
                  ))}
                </div>
              </div>
            )}

            {/* Write Scope */}
            {hasWriteScope && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
                  {t.writeScope.zh}
                  <span className="ml-1 font-normal normal-case">/ {t.writeScope.en}</span>
                </p>
                <div className="flex items-start gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {highlightInlineCode(data.writeScope!)}
                  </p>
                </div>
              </div>
            )}

            {/* Task ID */}
            {data.taskId && (
              <p className="text-[11px] text-muted-foreground/60 font-mono">{data.taskId}</p>
            )}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !border-2 !border-background opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ background: config.accentVar }}
      />
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
export type { TaskNodeData };
