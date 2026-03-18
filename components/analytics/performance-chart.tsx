'use client';

import React from 'react';
import { Card } from '@/components/ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { CHART_COLORS } from '@/lib/design/chart-colors';

interface PerformanceChartProps {
  data: {
    date: string;
    correct: number;
    total: number;
    percentage: number;
  }[];
}

function PerformanceChartBase({ data }: PerformanceChartProps) {
  // Format data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    'Taxa de Acerto (%)': Math.round(item.percentage),
    'Questões': item.total,
  }));

  return (
    <Card variant="glass" className="p-6">
      <h3 className="text-xl font-semibold text-white mb-6">
        Evolução de Performance
      </h3>

      {chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-navy-400">
          Sem dados suficientes. Continue praticando!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="date"
              stroke={CHART_COLORS.gridStroke}
              style={{ fontSize: '12px' }}
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
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="Taxa de Acerto (%)"
              stroke={CHART_COLORS.primary}
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.primary, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

export const PerformanceChart = React.memo(PerformanceChartBase);
