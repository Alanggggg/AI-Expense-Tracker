
export type TransactionCategory = string;

export enum TransactionType {
  Expense = 'Expense',
  Income = 'Income'
}

export interface Transaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  subcategory?: string; // Level 2 category
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
}

// Key: Main Category, Value: List of Subcategories
export type CategoryHierarchy = Record<string, string[]>;
