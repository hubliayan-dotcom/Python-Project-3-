import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { StockDataPoint } from '../types.ts';

interface Props {
  data: StockDataPoint[];
}

export const RsiChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-[200px] bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            hide
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 10 }}
            ticks={[30, 70]}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: '30', fontSize: 10 }} />
          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: '70', fontSize: 10 }} />
          <Area
            type="monotone"
            dataKey="rsi14"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.1}
            name="RSI (14)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
