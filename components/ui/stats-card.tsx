'use client';

import { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { Card } from './card';

// Unified StatsCard - supports both dashboard and analytics variants
export interface StatsCardProps extends HTMLAttributes<HTMLDivElement> {
  // Required props
  value: string | number;

  // Flexible labeling (label OU title)
  label?: string;
  title?: string;

  // Icon can be ReactNode or LucideIcon
  icon?: ReactNode | LucideIcon;

  // Optional props
  trend?: number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'cyan' | 'amber';
  variant?: 'default' | 'compact'; // default = dashboard style, compact = analytics style
}

export function StatsCard({
  icon,
  label,
  title,
  value,
  trend,
  subtitle,
  color = 'blue',
  variant = 'default',
  className,
  ...props
}: StatsCardProps) {
  const displayLabel = label || title || '';

  // Color classes for icon background
  // v2.0: blue/green/amber usam tokens do design system (accent/success/warning) —
  // acompanham o tema automaticamente. purple/cyan seguem hardcoded (cores
  // decorativas, fora da paleta semântica core).
  const iconColorClasses = {
    default: {
      blue: 'bg-accent-soft text-accent group-hover:bg-accent-soft',
      green: 'bg-success-soft text-success group-hover:bg-success-soft',
      purple: 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30',
      cyan: 'bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30',
      amber: 'bg-warning-soft text-warning group-hover:bg-warning-soft',
    },
    compact: {
      blue: 'bg-accent-soft text-accent border-accent',
      green: 'bg-success-soft text-success border-success',
      purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      amber: 'bg-warning-soft text-warning border-warning',
    },
  };

  const glowColors = {
    blue: 'bg-accent',
    green: 'bg-success',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
    amber: 'bg-warning',
  };

  // Render icon (supports both LucideIcon component and ReactNode)
  const renderIcon = () => {
    if (!icon) return null;

    // Check if it's a Lucide icon component
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className={variant === 'compact' ? "w-6 h-6" : "w-5 h-5"} />;
    }

    return icon;
  };

  // Compact variant (analytics style)
  if (variant === 'compact') {
    return (
      <Card variant="glass" className={clsx('p-6', className)} {...props}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-ink-2 text-sm font-medium mb-2">{displayLabel}</p>
            <p className="text-3xl font-bold text-ink-1 mb-1">{value}</p>
            {subtitle && (
              <p className="text-ink-3 text-sm">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={clsx(
              'w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0',
              iconColorClasses.compact[color]
            )}>
              {renderIcon()}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Default variant (dashboard style)
  return (
    <div className={clsx('group relative', className)} {...props}>
      {/* Subtle hover accent */}
      <div className={clsx(
        'absolute inset-0 opacity-0 group-hover:opacity-5 blur-xl transition-opacity duration-500 pointer-events-none',
        glowColors[color]
      )} />

      <div className="relative bg-surface border rounded-2xl p-6 hover:border-strong transition-all">
        <div className="flex items-start justify-between mb-4">
          {icon && (
            <div className={clsx('p-3 rounded-xl transition-colors', iconColorClasses.default[color])}>
              {renderIcon()}
            </div>
          )}
          {trend !== undefined && (
            <div className={clsx(
              'flex items-center gap-1 text-sm',
              trend >= 0 ? 'text-success' : 'text-danger'
            )}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trend >= 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-3xl font-bold text-ink-1 mb-1">
            {value}
          </p>
          <p className="text-sm text-ink-3">
            {displayLabel}
          </p>
          {subtitle && (
            <p className="text-ink-3 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
