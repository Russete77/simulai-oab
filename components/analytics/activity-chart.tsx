'use client';

import React from 'react';
import { Card } from '@/components/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { CHART_COLORS } from '@/lib/design/chart-colors';

interface ActivityChartProps {
  data: {
    date: string;
    questionsAnswered: number;
  }[];
}

function ActivityChartBase({ data }: ActivityChartProps) {
  // Format data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    }),
    'Questões': item.questionsAnswered,
  }));

  return (
    <Card variant="glass" className="p-6">
      <h3 className="text-xl font-semibold text-white mb-6">
        Atividade Recente (7 dias)
      </h3>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-navy-400">
          Sem atividade recente
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="date"
              stroke={CHART_COLORS.gridStroke}
              style={{ fontSize: '11px' }}
            />
            <YAxis
              stroke={CHART_COLORS.gridStroke}
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: CHART_COLORS.background,
                border: `1px solid ${CHART_COLORS.grid}`,
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Bar
              dataKey="Questões"
              fill={CHART_COLORS.primary}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

export const ActivityChart = React.memo(ActivityChartBase);
