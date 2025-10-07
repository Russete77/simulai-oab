'use client';

import { Card } from '@/components/ui';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'cyan';
}

const colorClasses = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  green: 'bg-green-500/10 text-green-400 border-green-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue' }: StatsCardProps) {
  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-navy-400 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {subtitle && (
            <p className="text-navy-500 text-sm">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
