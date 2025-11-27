
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, TransactionType, ExpenseSummary, CategoryStyle, CategoryHierarchy } from '../types';
import { DEFAULT_CATEGORIES, CUSTOM_CATEGORY_COLORS, DEFAULT_HIERARCHY } from '../constants';

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
  
  // Hierarchy Management
  categoryHierarchy: CategoryHierarchy;
  registerSubcategory: (category: string, subcategory: string) => void;
  deleteSubcategory: (category: string, subcategory: string) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Manage categories and their styles
  const [categoryStyles, setCategoryStyles] = useState<Record<string, CategoryStyle>>(() => {
    const defaults: Record<string, CategoryStyle> = {};
    Object.entries(DEFAULT_CATEGORIES).forEach(([name, colorClass]) => {
      defaults[name] = { colorClass, isCustom: false };
    });
    return defaults;
  });

  // Manage Category Hierarchy (Level 1 -> Level 2[])
  const [categoryHierarchy, setCategoryHierarchy] = useState<CategoryHierarchy>(() => {
    return DEFAULT_HIERARCHY;
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

    const savedHierarchy = localStorage.getItem('categoryHierarchy');
    if (savedHierarchy) {
      try {
        const parsed = JSON.parse(savedHierarchy);
        setCategoryHierarchy(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load hierarchy", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('categoryStyles', JSON.stringify(categoryStyles));
  }, [categoryStyles]);

  useEffect(() => {
    localStorage.setItem('categoryHierarchy', JSON.stringify(categoryHierarchy));
  }, [categoryHierarchy]);

  const registerCategory = useCallback((categoryName: string) => {
    // 1. Register Style
    setCategoryStyles(prev => {
      if (prev[categoryName]) return prev;
      const randomColor = CUSTOM_CATEGORY_COLORS[Math.floor(Math.random() * CUSTOM_CATEGORY_COLORS.length)];
      return {
        ...prev,
        [categoryName]: {
          colorClass: randomColor,
          isCustom: true
        }
      };
    });

    // 2. Register in Hierarchy (init empty array if new)
    setCategoryHierarchy(prev => {
      if (prev[categoryName]) return prev;
      return { ...prev, [categoryName]: [] };
    });
  }, []);

  const registerSubcategory = useCallback((categoryName: string, subcategoryName: string) => {
    if (!subcategoryName.trim()) return;
    
    setCategoryHierarchy(prev => {
      const currentSubs = prev[categoryName] || [];
      // Case-insensitive check
      if (currentSubs.some(s => s.toLowerCase() === subcategoryName.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        [categoryName]: [...currentSubs, subcategoryName]
      };
    });
  }, []);

  const deleteSubcategory = useCallback((categoryName: string, subcategoryName: string) => {
    setCategoryHierarchy(prev => {
      const currentSubs = prev[categoryName] || [];
      return {
        ...prev,
        [categoryName]: currentSubs.filter(s => s !== subcategoryName)
      };
    });
  }, []);

  const normalizeCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return "Uncategorized";
    const existingKey = Object.keys(categoryStyles).find(
      k => k.toLowerCase() === trimmed.toLowerCase()
    );
    if (existingKey) return existingKey;
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }, [categoryStyles]);

  const addTransaction = useCallback((transaction: Transaction) => {
    const cleanCategory = normalizeCategory(transaction.category);
    const cleanSubcategory = transaction.subcategory?.trim();

    // Ensure Main Category exists
    registerCategory(cleanCategory);
    
    // Ensure Subcategory exists (if provided)
    if (cleanSubcategory) {
      registerSubcategory(cleanCategory, cleanSubcategory);
    }
    
    const finalTransaction = { 
      ...transaction, 
      category: cleanCategory,
      subcategory: cleanSubcategory // Keep the original case or normalize if needed
    };

    setTransactions(prev => [finalTransaction, ...prev]);
  }, [registerCategory, registerSubcategory, normalizeCategory]);

  const updateTransaction = useCallback((updatedTransaction: Transaction) => {
    const cleanCategory = normalizeCategory(updatedTransaction.category);
    const cleanSubcategory = updatedTransaction.subcategory?.trim();

    registerCategory(cleanCategory);
    if (cleanSubcategory) {
      registerSubcategory(cleanCategory, cleanSubcategory);
    }
    
    const finalTransaction = { 
      ...updatedTransaction, 
      category: cleanCategory,
      subcategory: cleanSubcategory
    };
    
    setTransactions(prev => prev.map(t => t.id === finalTransaction.id ? finalTransaction : t));
  }, [registerCategory, registerSubcategory, normalizeCategory]);

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
      availableCategories,
      categoryHierarchy,
      registerSubcategory,
      deleteSubcategory
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
