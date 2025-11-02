// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';
import { Card } from '@/components/ui';

// Lazy load Recharts components (-150KB no bundle inicial)
const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart as any), { ssr: false });
const Line = dynamic(() => import('recharts').then((mod) => mod.Line as any), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis as any), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis as any), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid as any), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip as any), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer as any), { ssr: false });
const Legend = dynamic(() => import('recharts').then((mod) => mod.Legend as any), { ssr: false });

interface PerformanceChartProps {
  data: {
    date: string;
    correct: number;
    total: number;
    percentage: number;
  }[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
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
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
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
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="Taxa de Acerto (%)"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
