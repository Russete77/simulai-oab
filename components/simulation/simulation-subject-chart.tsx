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
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CHART_COLORS } from '@/lib/design/chart-colors';

interface SimulationSubjectChartProps {
  data: {
    subject: string;
    subjectLabel: string;
    total: number;
    correct: number;
    percentage: number;
  }[];
}

function SimulationSubjectChartBase({ data }: SimulationSubjectChartProps) {
  const chartData = data.map((item) => ({
    subject: item.subjectLabel,
    'Acertos (%)': Math.round(item.percentage),
    'Corretas': item.correct,
    'Total': item.total,
  }));

  return (
    <Card variant="glass" className="p-6">
      <h3 className="text-xl font-semibold text-white mb-6">
        Performance por Matéria
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            type="number"
            stroke={CHART_COLORS.gridStroke}
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
          />
          <YAxis
            type="category"
            dataKey="subject"
            stroke={CHART_COLORS.gridStroke}
            style={{ fontSize: '11px' }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.background,
              border: `1px solid ${CHART_COLORS.grid}`,
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value, name, props) => {
              if (name === 'Acertos (%)') {
                return [
                  `${value}% (${props.payload.Corretas}/${props.payload.Total})`,
                  name,
                ];
              }
              return [value, name];
            }}
          />
          <Bar dataKey="Acertos (%)" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => {
              const percentage = entry['Acertos (%)'];
              const color = percentage >= 70 ? CHART_COLORS.success : percentage >= 50 ? CHART_COLORS.warning : CHART_COLORS.error;
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export const SimulationSubjectChart = React.memo(SimulationSubjectChartBase);
