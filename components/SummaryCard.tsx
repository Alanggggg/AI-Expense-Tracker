import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { TrendingDown, TrendingUp, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';

const SummaryCard: React.FC = () => {
  const { summary, selectedMonth, changeMonth } = useExpenses();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  const formattedDate = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Wallet size={120} />
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-2 relative z-10">
           <button 
             onClick={() => changeMonth(-1)}
             className="p-1 -ml-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
           >
             <ChevronLeft size={20} />
           </button>
           
           <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
             {formattedDate}
           </h2>

           <button 
             onClick={() => changeMonth(1)}
             className="p-1 -mr-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
           >
             <ChevronRight size={20} />
           </button>
        </div>

        <div className="text-3xl font-bold text-gray-900 mb-6 z-10 relative">
          {summary.balance < 0 ? '-' : ''}{formatCurrency(summary.balance)}
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full text-green-600">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Income</p>
              <p className="font-semibold text-green-600">{formatCurrency(summary.totalIncome)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full text-red-600">
              <TrendingDown size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Expense</p>
              <p className="font-semibold text-red-600">{formatCurrency(summary.totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;