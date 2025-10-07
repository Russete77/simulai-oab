'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Card } from '@/components/ui';

interface SimulationSubjectChartProps {
  data: {
    subject: string;
    subjectLabel: string;
    total: number;
    correct: number;
    percentage: number;
  }[];
}

export function SimulationSubjectChart({ data }: SimulationSubjectChartProps) {
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
            style={{ fontSize: '11px' }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e3a5f',
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
              const color = percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
