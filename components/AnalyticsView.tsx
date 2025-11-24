
import React, { useState, useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { TransactionType } from '../types';
import { X, ChevronLeft, ChevronRight, PieChart, BarChart3 } from 'lucide-react';
import { CATEGORY_ICONS, DEFAULT_ICON } from '../constants';

// Map Tailwind colors to Hex for SVG usage
const COLOR_MAP: Record<string, string> = {
  'orange': '#ea580c', // orange-600
  'blue': '#2563eb',   // blue-600
  'purple': '#9333ea', // purple-600
  'pink': '#db2777',   // pink-600
  'teal': '#0d9488',   // teal-600
  'rose': '#e11d48',   // rose-600
  'cyan': '#0891b2',
  'emerald': '#059669',
  'indigo': '#4f46e5',
  'violet': '#7c3aed',
  'fuchsia': '#c026d3',
  'lime': '#65a30d',
  'amber': '#d97706',
  'gray': '#4b5563',
};

// Helper to extract color name from tailwind class string (e.g. "bg-orange-100 text-orange-600")
const extractColorHex = (colorClass: string): string => {
  const match = colorClass.match(/text-([a-z]+)-600/);
  if (match && COLOR_MAP[match[1]]) {
    return COLOR_MAP[match[1]];
  }
  return '#4b5563'; // Default gray
};

interface AnalyticsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ isOpen, onClose }) => {
  const { filteredTransactions, summary, categoryStyles, selectedMonth, changeMonth } = useExpenses();
  const [activeTab, setActiveTab] = useState<'categories' | 'trends'>('categories');
  const [touchedBarIndex, setTouchedBarIndex] = useState<number | null>(null);

  // --- Data Prep for Pie Chart ---
  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === TransactionType.Expense);
    const total = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const grouped = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

    return (Object.entries(grouped) as [string, number][])
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: total === 0 ? 0 : (amount / total) * 100,
        colorHex: extractColorHex(categoryStyles[name]?.colorClass || ''),
        style: categoryStyles[name]
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categoryStyles]);

  // --- Data Prep for Bar Chart ---
  const trendData = useMemo(() => {
    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // Create map of day -> total expense
    const expenseByDay = filteredTransactions
      .filter(t => t.type === TransactionType.Expense)
      .reduce((acc, t) => {
        const day = new Date(t.date).getDate();
        acc[day] = (acc[day] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<number, number>);

    const values = Object.values(expenseByDay) as number[];
    const maxAmount = Math.max(...values, 1); // Avoid division by zero

    return days.map(day => ({
      day,
      amount: expenseByDay[day] || 0,
      heightPercentage: ((expenseByDay[day] || 0) / maxAmount) * 100
    }));
  }, [filteredTransactions, selectedMonth]);

  // --- SVG Math for Donut Chart ---
  const renderDonutSegments = () => {
    let cumulativePercent = 0;
    
    if (categoryData.length === 0) {
      return <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />;
    }

    return categoryData.map((cat, index) => {
      // Circumference of circle with r=40 is ~251.3
      const circleCircumference = 2 * Math.PI * 40; 
      const strokeDasharray = `${(cat.percentage / 100) * circleCircumference} ${circleCircumference}`;
      const strokeDashoffset = -1 * (cumulativePercent / 100) * circleCircumference;
      
      cumulativePercent += cat.percentage;

      return (
        <circle
          key={cat.name}
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={cat.colorHex}
          strokeWidth="12"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap={categoryData.length === 1 ? "round" : "butt"} // Round cap only if 1 item
          className="transition-all duration-500 ease-out hover:opacity-80"
          transform="rotate(-90 50 50)" // Start from top
        />
      );
    });
  };

  if (!isOpen) return null;

  const formattedDate = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const totalExpense = Math.abs(summary.totalExpense);

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center py-4 space-x-4 shrink-0">
        <button onClick={() => changeMonth(-1)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><ChevronLeft size={24} /></button>
        <span className="text-lg font-semibold text-gray-800 w-36 text-center">{formattedDate}</span>
        <button onClick={() => changeMonth(1)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><ChevronRight size={24} /></button>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-6 shrink-0">
        <div className="bg-gray-100 p-1 rounded-xl flex">
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'categories' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            <PieChart size={16} /> Breakdown
          </button>
          <button 
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'trends' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            <BarChart3 size={16} /> Trends
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-20">
        
        {/* VIEW 1: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {/* Donut Chart */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {renderDonutSegments()}
              </svg>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total Spent</span>
                <span className="text-2xl font-bold text-gray-900">${totalExpense.toFixed(0)}</span>
              </div>
            </div>

            {/* Category List */}
            <div className="space-y-4">
              {categoryData.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.name] || DEFAULT_ICON;
                return (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${cat.style?.colorClass || 'bg-gray-100 text-gray-600'}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{cat.name}</div>
                        <div className="text-xs text-gray-400">{cat.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900">
                      ${cat.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
              {categoryData.length === 0 && (
                <div className="text-center text-gray-400 py-10">No expenses this month</div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: TRENDS */}
        {activeTab === 'trends' && (
          <div className="h-64 mt-10 animate-in fade-in zoom-in-95 duration-300 select-none pb-8">
            {categoryData.length > 0 ? (
              <div className="flex h-full items-end justify-between gap-1">
                {trendData.map((d, i) => (
                  <div 
                    key={d.day} 
                    className="relative flex flex-col justify-end items-center flex-1 group h-full"
                    onTouchStart={() => setTouchedBarIndex(i)}
                    onMouseEnter={() => setTouchedBarIndex(i)}
                  >
                    {/* Bar - Height is applied here relative to the full height lane */}
                    <div 
                      className={`w-full max-w-[12px] rounded-t-sm relative transition-all duration-300 ${d.amount > 0 ? 'bg-blue-500' : 'bg-gray-100'}`}
                      style={{ height: d.amount > 0 ? `${Math.max(d.heightPercentage, 2)}%` : '4px' }}
                    >
                        {/* Tooltip rides on top of the bar */}
                        {(touchedBarIndex === i) && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                              Day {d.day}: ${d.amount.toFixed(0)}
                            </div>
                        )}
                    </div>
                    
                    {/* X-Axis Label */}
                    {(d.day === 1 || d.day % 5 === 0) && (
                       <div className="absolute top-full mt-2 text-[10px] text-gray-400">{d.day}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-center text-gray-400 py-10">No expenses this month to show trends</div>
            )}
            
            {/* Axis Title */}
            {categoryData.length > 0 && (
              <div className="text-center mt-8 text-xs text-gray-400 uppercase tracking-widest">
                Daily Spending Trend
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AnalyticsView;
