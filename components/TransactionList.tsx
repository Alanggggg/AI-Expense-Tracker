import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';
import { TransactionType } from '../types';
import { Trash2 } from 'lucide-react';

const TransactionList: React.FC = () => {
  // Use filteredTransactions to show only the selected month's data
  const { filteredTransactions, deleteTransaction, selectedMonth } = useExpenses();

  if (filteredTransactions.length === 0) {
    const isCurrentMonth = new Date().getMonth() === selectedMonth.getMonth() && 
                           new Date().getFullYear() === selectedMonth.getFullYear();
    
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-lg">No transactions found</p>
        <p className="text-sm mt-2">
          {isCurrentMonth ? "Type below to add one!" : "Try selecting a different month."}
        </p>
      </div>
    );
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 pb-32 no-scrollbar">
      <h3 className="text-lg font-bold text-gray-800 mt-2 mb-4">Transactions</h3>
      {filteredTransactions.map((t) => {
        const Icon = CATEGORY_ICONS[t.category];
        const colorClass = CATEGORY_COLORS[t.category];

        return (
          <div 
            key={t.id} 
            className="group flex items-center bg-white p-4 rounded-xl border border-gray-50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className={`p-3 rounded-full ${colorClass} mr-4`}>
              <Icon size={20} />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-gray-900">{t.category}</h4>
                <span className={`font-bold ${t.type === TransactionType.Expense ? 'text-gray-900' : 'text-green-600'}`}>
                  {t.type === TransactionType.Expense ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-500 truncate max-w-[180px]">{t.note}</p>
                <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
              </div>
            </div>

            <button 
              onClick={() => deleteTransaction(t.id)}
              className="ml-3 opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-opacity"
              aria-label="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList;