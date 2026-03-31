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
  const iconColorClasses = {
    default: {
      blue: 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30',
      green: 'bg-green-500/20 text-green-500 group-hover:bg-green-500/30',
      purple: 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30',
      cyan: 'bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30',
      amber: 'bg-amber-500/20 text-amber-500 group-hover:bg-amber-500/30',
    },
    compact: {
      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      green: 'bg-green-500/10 text-green-500 border-green-500/20',
      purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    },
  };

  const glowColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
    amber: 'bg-amber-500',
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
            <p className="text-navy-400 text-sm font-medium mb-2">{displayLabel}</p>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            {subtitle && (
              <p className="text-navy-500 text-sm">{subtitle}</p>
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

      <div className="relative bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
        <div className="flex items-start justify-between mb-4">
          {icon && (
            <div className={clsx('p-3 rounded-xl transition-colors', iconColorClasses.default[color])}>
              {renderIcon()}
            </div>
          )}
          {trend !== undefined && (
            <div className={clsx(
              'flex items-center gap-1 text-sm',
              trend >= 0 ? 'text-green-500' : 'text-red-500'
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
            {displayLabel}
          </p>
          {subtitle && (
            <p className="text-navy-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
