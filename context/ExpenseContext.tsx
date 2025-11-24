
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, TransactionType, ExpenseSummary, CategoryStyle } from '../types';
import { DEFAULT_CATEGORIES, CUSTOM_CATEGORY_COLORS } from '../constants';

interface ExpenseContextType {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  summary: ExpenseSummary;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  selectedMonth: Date;
  changeMonth: (offset: number) => void;
  
  // Category Management
  categoryStyles: Record<string, CategoryStyle>;
  availableCategories: string[];
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Manage categories and their styles
  const [categoryStyles, setCategoryStyles] = useState<Record<string, CategoryStyle>>(() => {
    // Initialize with defaults
    const defaults: Record<string, CategoryStyle> = {};
    Object.entries(DEFAULT_CATEGORIES).forEach(([name, colorClass]) => {
      defaults[name] = { colorClass, isCustom: false };
    });
    return defaults;
  });

  // Load data from local storage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch (e) {
        console.error("Failed to load transactions", e);
      }
    }

    const savedCategories = localStorage.getItem('categoryStyles');
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        setCategoryStyles(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    // Only save custom categories to avoid bloat, but for simplicity saving all is fine
    // Filter out defaults if we wanted to be strict, but saving all ensures consistency
    localStorage.setItem('categoryStyles', JSON.stringify(categoryStyles));
  }, [categoryStyles]);

  const registerCategory = useCallback((categoryName: string) => {
    setCategoryStyles(prev => {
      if (prev[categoryName]) return prev;

      // Pick a random color for the new category
      const randomColor = CUSTOM_CATEGORY_COLORS[Math.floor(Math.random() * CUSTOM_CATEGORY_COLORS.length)];
      
      return {
        ...prev,
        [categoryName]: {
          colorClass: randomColor,
          isCustom: true
        }
      };
    });
  }, []);

  const addTransaction = useCallback((transaction: Transaction) => {
    // Ensure category is registered
    registerCategory(transaction.category);
    
    setTransactions(prev => [transaction, ...prev]);
  }, [registerCategory]);

  const updateTransaction = useCallback((updatedTransaction: Transaction) => {
    // Ensure category is registered (in case it was changed to a new one)
    registerCategory(updatedTransaction.category);
    
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  }, [registerCategory]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const changeMonth = useCallback((offset: number) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  }, []);

  // Filter transactions based on selected month
  const filteredTransactions = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth]);

  const summary = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.Expense) {
        acc.totalExpense += t.amount;
        acc.balance -= t.amount;
      } else {
        acc.totalIncome += t.amount;
        acc.balance += t.amount;
      }
      return acc;
    }, { totalExpense: 0, totalIncome: 0, balance: 0 });
  }, [filteredTransactions]);

  const availableCategories = useMemo(() => Object.keys(categoryStyles), [categoryStyles]);

  return (
    <ExpenseContext.Provider value={{ 
      transactions, 
      filteredTransactions,
      addTransaction, 
      updateTransaction,
      deleteTransaction, 
      summary,
      isLoading,
      setIsLoading,
      selectedMonth,
      changeMonth,
      categoryStyles,
      availableCategories
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
