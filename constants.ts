
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
};

// Default Subcategories for hierarchy
export const DEFAULT_HIERARCHY: Record<string, string[]> = {
  'Food': ['Groceries', 'Dining Out', 'Coffee', 'Snacks', 'Delivery'],
  'Transport': ['Taxi', 'Bus', 'Subway', 'Fuel', 'Parking', 'Flight'],
  'Shopping': ['Clothes', 'Electronics', 'Home', 'Beauty', 'Gifts'],
  'Entertainment': ['Movies', 'Games', 'Sports', 'Streaming', 'Hobbies'],
  'Housing': ['Rent', 'Utilities', 'Maintenance', 'Internet', 'Services'],
  'Health': ['Doctor', 'Pharmacy', 'Gym', 'Therapy', 'Insurance'],
};

// Icon mapping for Default Categories
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Food': Utensils,
  'Transport': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Housing': Home,
  'Health': Heart,
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
