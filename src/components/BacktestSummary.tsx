import React from 'react';
import { TrendingUp, Activity, ShieldAlert, RotateCcw } from 'lucide-react';
import { BacktestStats } from '../types.ts';

interface Props {
  stats: BacktestStats;
}

export const BacktestSummary: React.FC<Props> = ({ stats }) => {
  const items = [
    { 
      label: 'Total P&L', 
      value: `${(stats.pnl * 100).toFixed(2)}%`, 
      icon: TrendingUp,
      color: stats.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
    },
    { 
      label: 'Sharpe Ratio', 
      value: stats.sharpe.toFixed(2), 
      icon: Activity,
      color: 'text-blue-600'
    },
    { 
      label: 'Max Drawdown', 
      value: `${(stats.max_dd * 100).toFixed(2)}%`, 
      icon: ShieldAlert,
      color: 'text-rose-600'
    },
    { 
      label: 'Total Trades', 
      value: stats.trades, 
      icon: RotateCcw,
      color: 'text-indigo-600'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className={`p-2 rounded-lg bg-gray-50 ${item.color}`}>
            <item.icon size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{item.label}</p>
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
