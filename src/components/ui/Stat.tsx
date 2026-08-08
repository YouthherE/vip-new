import { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export type StatTone = 'brand' | 'sun' | 'mint' | 'purple' | 'pink' | 'blue';

const toneVar: Record<StatTone, string> = {
  brand: 'var(--brand)',
  sun: 'var(--color-sun)',
  mint: 'var(--color-mint)',
  purple: 'var(--color-purple)',
  pink: 'var(--color-pink)',
  blue: 'var(--color-blue)',
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: StatTone;
  delta?: string;
  deltaDir?: 'up' | 'down';
  hint?: string;
}

/** 关键指标卡：横向紧凑布局，图标 + 数值 + 标签在一行 */
export function StatCard({ label, value, icon: Icon, tone = 'brand', delta, deltaDir = 'up', hint }: StatCardProps) {
  const c = toneVar[tone];
  return (
    <div className="card card-hover animate-fade-up p-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `color-mix(in srgb, ${c} 15%, transparent)`, color: c }}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-ink-3">{label}</p>
          <p className="text-base font-bold tracking-tight text-ink">{value}</p>
        </div>
        {(delta || hint) && (
          <span className={`shrink-0 inline-flex items-center gap-0.5 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium ${deltaDir === 'down' ? 'text-danger' : 'text-success'}`}>
            {delta && (
              <>
                {deltaDir === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {delta}
              </>
            )}
            {hint && <span className="ml-0.5 text-ink-3">{hint}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
