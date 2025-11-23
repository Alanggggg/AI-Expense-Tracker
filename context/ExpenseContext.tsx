import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, TransactionType, ExpenseSummary } from '../types';

interface ExpenseContextType {
  transactions: Transaction[]; // All transactions (for raw access if needed)
  filteredTransactions: Transaction[]; // Transactions for the selected month
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  summary: ExpenseSummary;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  selectedMonth: Date;
  changeMonth: (offset: number) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('transactions');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load transactions", e);
      }
    }
  }, []);

  // Save to local storage whenever transactions change
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
    // If user adds a transaction, ensure we are viewing the month of that transaction?
    // For now, let's keep the user on the current view to avoid jumping, 
    // unless it's a "live" tracker where they usually add for "today".
    // Optional: setSelectedMonth(new Date(transaction.date)); 
  }, []);

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

    // Sort by date descending (newest first)
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth]);

  // Calculate summary based on filtered (selected month) transactions
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

  return (
    <ExpenseContext.Provider value={{ 
      transactions, 
      filteredTransactions,
      addTransaction, 
      deleteTransaction, 
      summary,
      isLoading,
      setIsLoading,
      selectedMonth,
      changeMonth
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