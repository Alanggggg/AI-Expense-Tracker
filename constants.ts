
import { 
  Utensils, 
  Car, 
  ShoppingBag, 
  Film, 
  Home, 
  Heart,
  MoreHorizontal,
  Tag,
  LucideIcon
} from 'lucide-react';

// Default System Categories
export const DEFAULT_CATEGORIES: Record<string, string> = {
  'Food': 'bg-orange-100 text-orange-600',
  'Transport': 'bg-blue-100 text-blue-600',
  'Shopping': 'bg-purple-100 text-purple-600',
  'Entertainment': 'bg-pink-100 text-pink-600',
  'Housing': 'bg-teal-100 text-teal-600',
  'Health': 'bg-rose-100 text-rose-600',
  'Others': 'bg-gray-100 text-gray-600',
};

// Icon mapping for Default Categories
// Custom categories will default to the Tag icon
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Food': Utensils,
  'Transport': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Housing': Home,
  'Health': Heart,
  'Others': MoreHorizontal,
};

export const DEFAULT_ICON = Tag;

// Palette for new custom categories
export const CUSTOM_CATEGORY_COLORS = [
  'bg-cyan-100 text-cyan-600',
  'bg-emerald-100 text-emerald-600',
  'bg-indigo-100 text-indigo-600',
  'bg-violet-100 text-violet-600',
  'bg-fuchsia-100 text-fuchsia-600',
  'bg-lime-100 text-lime-600',
  'bg-amber-100 text-amber-600',
];
