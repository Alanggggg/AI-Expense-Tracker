export enum TransactionCategory {
  Food = 'Food',
  Transport = 'Transport',
  Shopping = 'Shopping',
  Entertainment = 'Entertainment',
  Housing = 'Housing',
  Others = 'Others'
}

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