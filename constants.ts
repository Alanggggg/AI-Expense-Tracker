import { TransactionCategory } from './types';
import { 
  Utensils, 
  Car, 
  ShoppingBag, 
  Film, 
  Home, 
  MoreHorizontal,
  LucideIcon
} from 'lucide-react';

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  [TransactionCategory.Food]: 'bg-orange-100 text-orange-600',
  [TransactionCategory.Transport]: 'bg-blue-100 text-blue-600',
  [TransactionCategory.Shopping]: 'bg-purple-100 text-purple-600',
  [TransactionCategory.Entertainment]: 'bg-pink-100 text-pink-600',
  [TransactionCategory.Housing]: 'bg-teal-100 text-teal-600',
  [TransactionCategory.Others]: 'bg-gray-100 text-gray-600',
};

export const CATEGORY_ICONS: Record<TransactionCategory, LucideIcon> = {
  [TransactionCategory.Food]: Utensils,
  [TransactionCategory.Transport]: Car,
  [TransactionCategory.Shopping]: ShoppingBag,
  [TransactionCategory.Entertainment]: Film,
  [TransactionCategory.Housing]: Home,
  [TransactionCategory.Others]: MoreHorizontal,
};