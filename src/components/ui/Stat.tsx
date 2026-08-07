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

/** 关键指标卡：彩色图标芯片 + 数值 + 趋势 */
export function StatCard({ label, value, icon: Icon, tone = 'brand', delta, deltaDir = 'up', hint }: StatCardProps) {
  const c = toneVar[tone];
  return (
    <div className="card card-hover animate-fade-up p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-2">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
        </div>
        {Icon && (
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: `color-mix(in srgb, ${c} 15%, transparent)`, color: c }}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {(delta || hint) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {delta && (
            <span className={deltaDir === 'down' ? 'text-danger' : 'text-success'}>
              {deltaDir === 'down' ? (
                <ArrowDownRight className="inline h-3.5 w-3.5" />
              ) : (
                <ArrowUpRight className="inline h-3.5 w-3.5" />
              )}
              {delta}
            </span>
          )}
          {hint && <span className="text-ink-3">{hint}</span>}
        </div>
      )}
    </div>
  );
}
