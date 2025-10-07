'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui';

interface ActivityChartProps {
  data: {
    date: string;
    questionsAnswered: number;
  }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
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
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              style={{ fontSize: '11px' }}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e3a5f',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Bar
              dataKey="Questões"
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
