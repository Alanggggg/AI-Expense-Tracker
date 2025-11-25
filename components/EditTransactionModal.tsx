
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import { X, Save, Trash2, ChevronDown, Check, Plus } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, isOpen, onClose }) => {
  const { updateTransaction, deleteTransaction, availableCategories } = useExpenses();
  
  const [amount, setAmount] = useState<number | string>('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.Expense);

  // Combobox State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false); // Control strict filtering
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transaction) {
      setAmount(Math.abs(transaction.amount));
      setCategory(transaction.category);
      setNote(transaction.note);
      // Format date for datetime-local input (YYYY-MM-DDThh:mm)
      try {
        const d = new Date(transaction.date);
        // Adjust for local timezone for the input display
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
        setDate(localISOTime);
      } catch (e) {
        setDate('');
      }
      setType(transaction.type);
    }
  }, [transaction]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !category || !date) return;

    const numAmount = Number(amount);
    
    updateTransaction({
      ...transaction,
      amount: numAmount, 
      category: category.trim(), // Ensure clean string
      note,
      date: new Date(date).toISOString(),
      type
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(transaction.id);
      onClose();
    }
  };

  // Filter logic: If showAllCategories is true (user clicked arrow), show everything.
  // Otherwise, filter based on input text.
  const filteredCategories = showAllCategories 
    ? availableCategories 
    : availableCategories.filter(c => c.toLowerCase().includes(category.toLowerCase()));

  const isExactMatch = availableCategories.some(c => c.toLowerCase() === category.toLowerCase());

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      {/* Click outside to close modal */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Edit Transaction</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Type Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType(TransactionType.Expense)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  type === TransactionType.Expense 
                    ? 'bg-white text-red-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType(TransactionType.Income)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  type === TransactionType.Income 
                    ? 'bg-white text-green-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Income
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-semibold text-gray-900"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Category Custom Combobox */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="relative">
                 <input
                  type="text"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setShowAllCategories(false); // Reset to filter mode when typing
                    setShowSuggestions(true);
                  }}
                  onFocus={(e) => {
                    setShowSuggestions(true);
                    e.target.select(); // UX: Select all text so typing replaces it instantly
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-10"
                  placeholder="Select or type new..."
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => {
                    const willOpen = !showSuggestions;
                    setShowSuggestions(willOpen);
                    if (willOpen) {
                      setShowAllCategories(true); // Explicitly show all when clicking chevron
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <ChevronDown size={16} className={`transition-transform duration-200 ${showSuggestions ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown Menu */}
              {showSuggestions && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCategory(c);
                          setShowSuggestions(false);
                          setShowAllCategories(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                      >
                        <span className="text-gray-700 font-medium">{c}</span>
                        {category === c && <Check size={16} className="text-blue-500" />}
                      </button>
                    ))
                  ) : null}
                  
                  {/* Create New Option - Show if the user typed something that isn't an exact match */}
                  {category.trim() && !isExactMatch && !showAllCategories && (
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-2 text-blue-600 border-t border-gray-50"
                    >
                      <Plus size={16} />
                      <span className="font-semibold">Create "{category}"</span>
                    </button>
                  )}
                  
                  {filteredCategories.length === 0 && !category.trim() && (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                      Type to create a new category
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700"
                required
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                placeholder="Add details..."
              />
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
          <button
            type="button"
            onClick={handleDelete}
            className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
            title="Delete Transaction"
          >
            <Trash2 size={20} />
          </button>
          <button
            type="submit"
            form="edit-form"
            className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTransactionModal;
