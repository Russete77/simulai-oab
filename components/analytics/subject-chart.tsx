'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui';

interface SubjectChartProps {
  data: {
    subject: string;
    subjectLabel: string;
    total: number;
    correct: number;
    percentage: number;
  }[];
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#6366f1', // indigo
];

export function SubjectChart({ data }: SubjectChartProps) {
  // Format data for chart and limit to top subjects
  const chartData = data
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8)
    .map((item, index) => ({
      subject: item.subjectLabel,
      'Taxa de Acerto (%)': Math.round(item.percentage),
      total: item.total,
      correct: item.correct,
      color: COLORS[index % COLORS.length],
    }));

  return (
    <Card variant="glass" className="p-6">
      <h3 className="text-xl font-semibold text-white mb-6">
        Performance por Matéria
      </h3>

      {chartData.length === 0 ? (
        <div className="h-96 flex items-center justify-center text-navy-400">
          Sem dados disponíveis
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis
              type="number"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
            />
            <YAxis
              type="category"
              dataKey="subject"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              width={150}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e3a5f',
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
