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
  // v2.0: blue/green alinhados com accent/success do design system (#004ac6 /
  // #059669). purple/cyan seguem decorativos, fora da paleta semântica core.
  const gradients = {
    blue: 'from-[#004ac6] to-[#2563eb]',
    green: 'from-[#059669] to-[#10b981]',
    purple: 'from-purple-500 to-pink-400',
    cyan: 'from-cyan-500 to-blue-400',
  };

  return (
    <div className={clsx('relative', className)} {...props}>
      {(label || showPercentage) && (
        <div className="flex justify-between mb-2">
          {label && <span className="text-sm text-ink-1/70">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-bold text-accent">{value}%</span>
          )}
        </div>
      )}

      <div className="relative h-2 bg-surface-2 rounded-full overflow-hidden">
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
