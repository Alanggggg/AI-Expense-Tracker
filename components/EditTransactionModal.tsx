
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import { X, Save, Trash2, ChevronDown, Check, Plus, ArrowRight } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  // New props for Creation Mode
  isCreationMode?: boolean;
  onConfirm?: (transaction: Transaction) => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ 
  transaction, 
  isOpen, 
  onClose,
  isCreationMode = false,
  onConfirm
}) => {
  const { updateTransaction, deleteTransaction, availableCategories, categoryHierarchy } = useExpenses();
  
  const [amount, setAmount] = useState<number | string>('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.Expense);

  // Combobox State for Category
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  // Combobox State for Subcategory
  const [showSubSuggestions, setShowSubSuggestions] = useState(false);
  const [showAllSubs, setShowAllSubs] = useState(false);
  const subDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transaction) {
      setAmount(Math.abs(transaction.amount));
      setCategory(transaction.category);
      setSubcategory(transaction.subcategory || '');
      setNote(transaction.note);
      try {
        const d = new Date(transaction.date);
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
        setDate(localISOTime);
      } catch (e) {
        setDate('');
      }
      setType(transaction.type);
    }
  }, [transaction]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(event.target as Node)) {
        setShowCatSuggestions(false);
      }
      if (subDropdownRef.current && !subDropdownRef.current.contains(event.target as Node)) {
        setShowSubSuggestions(false);
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
    
    const finalTransaction = {
      ...transaction,
      amount: numAmount, 
      category: category.trim(),
      subcategory: subcategory.trim() || undefined,
      note,
      date: new Date(date).toISOString(),
      type
    };

    if (isCreationMode && onConfirm) {
      // Creation Mode: Pass data back to parent
      onConfirm(finalTransaction);
    } else {
      // Edit Mode: Update via Context directly
      updateTransaction(finalTransaction);
    }
    onClose();
  };

  const handleDeleteOrCancel = () => {
    if (isCreationMode) {
      // Just close without saving
      onClose();
    } else {
      // Delete existing
      if (confirm('Are you sure you want to delete this transaction?')) {
        deleteTransaction(transaction.id);
        onClose();
      }
    }
  };

  // --- Category Filtering ---
  const filteredCategories = showAllCats 
    ? availableCategories 
    : availableCategories.filter(c => c.toLowerCase().includes(category.toLowerCase()));

  const isExactCatMatch = availableCategories.some(c => c.toLowerCase() === category.toLowerCase());

  // --- Subcategory Filtering ---
  const availableSubcategories = categoryHierarchy[category] || [];
  const filteredSubcategories = showAllSubs
    ? availableSubcategories
    : availableSubcategories.filter(s => s.toLowerCase().includes(subcategory.toLowerCase()));
  
  const isExactSubMatch = availableSubcategories.some(s => s.toLowerCase() === subcategory.toLowerCase());

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isCreationMode ? 'Verify Transaction' : 'Edit Transaction'}
          </h2>
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

            <div className="flex gap-3">
              {/* Category Custom Combobox */}
              <div className="relative flex-1" ref={catDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="relative">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setShowAllCats(false);
                      setShowCatSuggestions(true);
                      // Clear subcategory when main category changes
                      setSubcategory('');
                    }}
                    onFocus={(e) => {
                      setShowCatSuggestions(true);
                      e.target.select();
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-8 truncate"
                    placeholder="Main..."
                    required
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const willOpen = !showCatSuggestions;
                      setShowCatSuggestions(willOpen);
                      if (willOpen) {
                        setShowAllCats(true);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <ChevronDown size={14} className={`transition-transform duration-200 ${showCatSuggestions ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {showCatSuggestions && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCategory(c);
                            setSubcategory(''); // Reset sub on change
                            setShowCatSuggestions(false);
                            setShowAllCats(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                        >
                          <span className="text-gray-700 font-medium">{c}</span>
                          {category === c && <Check size={16} className="text-blue-500" />}
                        </button>
                      ))
                    ) : null}
                    
                    {category.trim() && !isExactCatMatch && !showAllCats && (
                      <button
                        type="button"
                        onClick={() => setShowCatSuggestions(false)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-2 text-blue-600 border-t border-gray-50"
                      >
                        <Plus size={16} />
                        <span className="font-semibold text-sm">New "{category}"</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Subcategory Custom Combobox */}
              <div className="relative flex-1" ref={subDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                <div className="relative">
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => {
                      setSubcategory(e.target.value);
                      setShowAllSubs(false);
                      setShowSubSuggestions(true);
                    }}
                    onFocus={(e) => {
                      setShowSubSuggestions(true);
                      e.target.select();
                    }}
                    disabled={!category}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-8 disabled:opacity-50 disabled:cursor-not-allowed truncate"
                    placeholder="Sub..."
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    disabled={!category}
                    onClick={() => {
                      const willOpen = !showSubSuggestions;
                      setShowSubSuggestions(willOpen);
                      if (willOpen) {
                        setShowAllSubs(true);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-0"
                  >
                    <ChevronDown size={14} className={`transition-transform duration-200 ${showSubSuggestions ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Subcategory Dropdown */}
                {showSubSuggestions && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {filteredSubcategories.length > 0 ? (
                      filteredSubcategories.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSubcategory(s);
                            setShowSubSuggestions(false);
                            setShowAllSubs(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                        >
                          <span className="text-gray-700 font-medium">{s}</span>
                          {subcategory === s && <Check size={16} className="text-blue-500" />}
                        </button>
                      ))
                    ) : null}

                    {subcategory.trim() && !isExactSubMatch && !showAllSubs && (
                       <button
                        type="button"
                        onClick={() => setShowSubSuggestions(false)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-2 text-blue-600 border-t border-gray-50"
                      >
                        <Plus size={16} />
                        <span className="font-semibold text-sm">New "{subcategory}"</span>
                      </button>
                    )}
                     {filteredSubcategories.length === 0 && !subcategory.trim() && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">
                        No presets found
                      </div>
                    )}
                  </div>
                )}
              </div>
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
            onClick={handleDeleteOrCancel}
            className={`p-3 rounded-xl transition-colors ${
              isCreationMode 
                ? 'text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 px-4'
                : 'text-red-500 bg-red-50 hover:bg-red-100'
            }`}
            title={isCreationMode ? "Cancel" : "Delete Transaction"}
          >
            {isCreationMode ? 'Cancel' : <Trash2 size={20} />}
          </button>
          
          <button
            type="submit"
            form="edit-form"
            className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isCreationMode ? (
              <>
                Confirm & Add
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTransactionModal;
