import { useLanguage } from '@/store';

const statusItems = [
  { key: 'pending', color: 'hsl(215 14% 60%)', en: 'Pending', zh: '待处理' },
  { key: 'in-progress', color: 'hsl(217 91% 60%)', en: 'In Progress', zh: '进行中' },
  { key: 'completed', color: 'hsl(142 71% 45%)', en: 'Completed', zh: '已完成' },
  { key: 'blocked', color: 'hsl(0 84% 60%)', en: 'Blocked', zh: '已阻塞' },
] as const;

export function DagLegend() {
  const { lang } = useLanguage();

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-xl shadow-sm p-3 space-y-1.5 text-xs min-w-[140px]">
      {statusItems.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
          <span className="text-muted-foreground">{lang === 'zh' ? item.zh : item.en}</span>
        </div>
      ))}
      <div className="border-t border-border/50 pt-1.5 mt-1.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 shrink-0 rounded" style={{ background: 'hsl(38 92% 50%)' }} />
          <span className="text-muted-foreground">{lang === 'zh' ? '关键路径' : 'Critical'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-0.5 shrink-0"
            style={{
              background: `repeating-linear-gradient(90deg, hsl(0 84% 60%) 0px, hsl(0 84% 60%) 4px, transparent 4px, transparent 7px)`,
            }}
          />
          <span className="text-muted-foreground">{lang === 'zh' ? '循环依赖' : 'Cycle'}</span>
        </div>
      </div>
    </div>
  );
}
