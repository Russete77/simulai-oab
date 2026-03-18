'use client';

import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  label?: string;
  color?: 'blue' | 'green' | 'purple' | 'cyan';
  showPercentage?: boolean;
}

export function Progress({
  value,
  label,
  color = 'blue',
  showPercentage = true,
  className,
  ...props
}: ProgressProps) {
  const gradients = {
    blue: 'from-blue-500 to-cyan-400',
    green: 'from-green-500 to-emerald-400',
    purple: 'from-purple-500 to-pink-400',
    cyan: 'from-cyan-500 to-blue-400',
  };

  return (
    <div className={clsx('relative', className)} {...props}>
      {(label || showPercentage) && (
        <div className="flex justify-between mb-2">
          {label && <span className="text-sm text-white/70">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-bold text-blue-400">{value}%</span>
          )}
        </div>
      )}

      <div className="relative h-2 bg-navy-800 rounded-full overflow-hidden">
        <div
          className={clsx(
            'absolute h-full bg-gradient-to-r rounded-full transition-all duration-500',
            gradients[color]
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
