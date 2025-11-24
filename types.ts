
export type TransactionCategory = string;

export enum TransactionType {
  Expense = 'Expense',
  Income = 'Income'
}

export interface Transaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  note: string;
  date: string; // ISO string
  type: TransactionType;
}

export interface ExpenseSummary {
  totalExpense: number;
  totalIncome: number;
  balance: number;
}

export interface CategoryStyle {
  colorClass: string;
  isCustom: boolean;
  // We don't store the icon component itself in state/storage, 
  // we'll handle icons logic in the UI layer
}
