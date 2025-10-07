'use client';

import { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatsCardProps extends HTMLAttributes<HTMLDivElement> {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: number;
  color?: 'blue' | 'green' | 'purple' | 'cyan' | 'amber';
}

export function StatsCard({
  icon,
  label,
  value,
  trend,
  color = 'blue',
  className,
  ...props
}: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30',
    green: 'bg-green-500/20 text-green-400 group-hover:bg-green-500/30',
    purple: 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30',
    amber: 'bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30',
  };

  const glowColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className={clsx('group relative', className)} {...props}>
      {/* Glow Effect */}
      <div className={clsx(
        'absolute inset-0 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500',
        glowColors[color]
      )} />

      <div className="relative bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className={clsx('p-3 rounded-xl transition-colors', colorClasses[color])}>
            {icon}
          </div>
          {trend !== undefined && (
            <div className={clsx(
              'flex items-center gap-1 text-sm',
              trend >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trend >= 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-3xl font-bold text-white mb-1">
            {value}
          </p>
          <p className="text-sm text-navy-600">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
