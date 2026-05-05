import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area
} from 'recharts';
import { StockDataPoint } from '../types.ts';

interface Props {
  data: StockDataPoint[];
}

export const StockChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-[500px] bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }} 
            tickFormatter={(val) => val.split('-').slice(1).join('/')}
          />
          <YAxis 
            yAxisId="left" 
            domain={['auto', 'auto']} 
            tick={{ fontSize: 12 }}
            tickFormatter={(val) => `$${val}`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            domain={[0, 100]} 
            hide
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="top" height={36}/>
          
          {/* Bollinger Bands */}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="bb_upper"
            stroke="transparent"
            fill="#3b82f6"
            fillOpacity={0.05}
            name="Bollinger Band"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="bb_lower"
            stroke="#e2e8f0"
            strokeDasharray="5 5"
            dot={false}
            name="BB Lower"
          />

          {/* Price & Moving Averages */}
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="close" 
            stroke="#0f172a" 
            strokeWidth={2}
            dot={false} 
            name="Price"
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="sma20" 
            stroke="#3b82f6" 
            strokeWidth={1.5}
            dot={false} 
            name="SMA 20"
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="sma50" 
            stroke="#f59e0b" 
            strokeWidth={1.5}
            dot={false} 
            name="SMA 50"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
