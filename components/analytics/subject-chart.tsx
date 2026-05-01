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
import { CHART_COLORS, getSubjectColor } from '@/lib/design/chart-colors';

interface SubjectChartProps {
  data: {
    subject: string;
    subjectLabel: string;
    total: number;
    correct: number;
    percentage: number;
  }[];
}


function SubjectChartBase({ data }: SubjectChartProps) {
  // Format data for chart and limit to top subjects
  const chartData = data
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8)
    .map((item, index) => ({
      subject: item.subjectLabel,
      'Taxa de Acerto (%)': Math.round(item.percentage),
      total: item.total,
      correct: item.correct,
      color: getSubjectColor(index),
    }));

  return (
    <Card variant="glass" className="p-6">
      <h3 className="text-xl font-semibold text-ink-1 mb-6">
        Performance por Matéria
      </h3>

      {chartData.length === 0 ? (
        <div className="h-96 flex items-center justify-center text-ink-2">
          Sem dados disponíveis
        </div>
      ) : (
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
              style={{ fontSize: '12px' }}
              width={150}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: CHART_COLORS.background,
                border: `1px solid ${CHART_COLORS.grid}`,
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value, name, props) => {
                if (name === 'Taxa de Acerto (%)') {
                  return [
                    `${value}% (${props.payload.correct}/${props.payload.total})`,
                    name,
                  ];
                }
                return [value, name];
              }}
            />
            <Bar dataKey="Taxa de Acerto (%)" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

export const SubjectChart = React.memo(SubjectChartBase);
