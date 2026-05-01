import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  accent?: 'blue' | 'green' | 'purple' | 'amber' | 'red';
  trend?: { value: number; label: string } | null;
}

const ACCENTS = {
  blue: 'from-blue-500/15 to-blue-500/5 border-accent text-accent',
  green: 'from-green-500/15 to-green-500/5 border-green-500/20 text-green-400',
  purple: 'from-purple-500/15 to-purple-500/5 border-purple-500/20 text-purple-400',
  amber: 'from-amber-500/15 to-amber-500/5 border-amber-500/20 text-amber-400',
  red: 'from-red-500/15 to-red-500/5 border-red-500/20 text-red-400',
};

export function KpiCard({ label, value, icon: Icon, hint, accent = 'blue', trend }: KpiCardProps) {
  return (
    <Card className="bg-surface border hover:border-strong transition-colors">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-ink-3 uppercase tracking-wider">
            {label}
          </span>
          {Icon && (
            <div
              className={cn(
                'w-9 h-9 rounded-lg bg-gradient-to-br border flex items-center justify-center',
                ACCENTS[accent]
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-ink-1">{value}</span>
          {trend && (
            <span
              className={cn(
                'text-xs font-medium',
                trend.value >= 0 ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </span>
          )}
        </div>
        {hint && <p className="text-xs text-ink-3 mt-1.5">{hint}</p>}
      </div>
    </Card>
  );
}
