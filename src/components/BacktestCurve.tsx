import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  data: { date: string; value: number }[];
}

export const BacktestCurve: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-[300px] bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold mb-4 text-gray-700 uppercase tracking-wider">Equity Curve</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            tickFormatter={(val) => val.split('-').slice(0, 2).join('-')}
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            tickFormatter={(val) => `${((val - 1) * 100).toFixed(0)}%`}
          />
          <Tooltip 
            formatter={(val: number) => [`${((val - 1) * 100).toFixed(2)}%`, 'P&L']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Strategy"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
