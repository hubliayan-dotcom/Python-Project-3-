import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, BarChart3, PieChart, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from './services/api.ts';
import { StockDataPoint, BacktestStats } from './types.ts';
import { StockChart } from './components/StockChart.tsx';
import { RsiChart } from './components/RsiChart.tsx';
import { BacktestSummary } from './components/BacktestSummary.tsx';
import { BacktestCurve } from './components/BacktestCurve.tsx';

export default function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [timeframe, setTimeframe] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StockDataPoint[]>([]);
  const [backtest, setBacktest] = useState<BacktestStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('AAPL');

  const fetchData = async (target: string, tf = timeframe) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching data for ${target} [${tf}]...`);
      const refreshResult = await api.refreshData(target);
      console.log("Refresh result:", refreshResult);
      
      const chartData = await api.getChartData(target, tf);
      const btStats = await api.runBacktest(target);
      
      setData(chartData);
      setBacktest(btStats);
      setTicker(target);
      setTimeframe(tf);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || 'Error fetching ticker data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("App mounted, starting initial fetch...");
    fetchData('AAPL');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = searchQuery.trim().toUpperCase();
    if (normalized) {
      fetchData(normalized);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BarChart3 className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">StockQuant</span>
          </div>

          <form onSubmit={handleSearch} className="relative w-full max-w-md hidden md:block">
            <input
              type="text"
              placeholder="Search ticker (e.g. NVDA, AMZN)..."
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          </form>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => fetchData(ticker)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              disabled={loading}
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 mb-1">
              <Activity size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Market Analysis</span>
            </div>
            <h1 className="text-4xl font-black">{ticker}</h1>
            <p className="text-slate-500">SMA Crossover Strategy & Momentum Analysis</p>
          </div>
          
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-100">
             <button 
               onClick={() => fetchData(ticker, 'daily')}
               className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${timeframe === 'daily' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               Daily
             </button>
             <button 
               onClick={() => fetchData(ticker, 'weekly')}
               className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${timeframe === 'weekly' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               Weekly
             </button>
             <button 
               onClick={() => fetchData(ticker, 'monthly')}
               className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${timeframe === 'monthly' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               Monthly
             </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="loading"
              className="flex flex-col items-center justify-center h-[400px] space-y-4"
            >
              <RefreshCw className="animate-spin text-blue-600" size={48} />
              <p className="text-slate-500 font-medium">Crunching market data...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key="error"
              className="bg-rose-50 border border-rose-100 p-8 rounded-2xl text-center"
            >
              <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="text-rose-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-rose-900 mb-2">Something went wrong</h2>
              <p className="text-rose-600 mb-6">{error}</p>
              <button 
                onClick={() => fetchData(ticker)}
                className="bg-rose-600 text-white px-6 py-2 rounded-full font-bold hover:bg-rose-700 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Backtest Stats Row */}
              {backtest && <BacktestSummary stats={backtest} />}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Charts Col */}
                <div className="lg:col-span-2 space-y-6">
                  <StockChart data={data} />
                  <RsiChart data={data} />
                </div>

                {/* Sidebar Col */}
                <div className="space-y-6">
                  {backtest && <BacktestCurve data={backtest.curve} />}
                  
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                       <PieChart size={20} className="text-blue-400" />
                       Strategy Stats
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                      This model uses a classic 20/50 SMA crossover logic. 
                      Entries are simulated at the next day open to prevent look-ahead bias.
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Win Rate</span>
                        <span className="font-mono font-bold">{((backtest?.win_rate || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Commission</span>
                        <span className="font-mono font-bold">5 bps</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Benchmark (B&H)</span>
                        <span className="font-mono font-bold text-emerald-400">+12.4%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
