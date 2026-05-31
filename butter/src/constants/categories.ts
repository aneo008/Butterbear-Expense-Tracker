export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_custom: number;
  sort_order: number;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food',      name: 'Food',      icon: '🍜', color: '#F5C45E', is_custom: 0, sort_order: 0 },
  { id: 'drinks',    name: 'Drinks',    icon: '☕', color: '#E3C49A', is_custom: 0, sort_order: 1 },
  { id: 'transport', name: 'Transport', icon: '🚇', color: '#A8D8C8', is_custom: 0, sort_order: 2 },
  { id: 'shopping',  name: 'Shopping',  icon: '🛍️', color: '#F4A6A0', is_custom: 0, sort_order: 3 },
  { id: 'fun',       name: 'Fun',       icon: '🎮', color: '#C4A8D8', is_custom: 0, sort_order: 4 },
  { id: 'home',      name: 'Home',      icon: '🏠', color: '#A8C4D8', is_custom: 0, sort_order: 5 },
  { id: 'health',    name: 'Health',    icon: '💊', color: '#D8A8C4', is_custom: 0, sort_order: 6 },
  { id: 'gifts',     name: 'Gifts',     icon: '🎁', color: '#C4D8A8', is_custom: 0, sort_order: 7 },
  { id: 'other',     name: 'Other',     icon: '📦', color: '#9C8772', is_custom: 0, sort_order: 8 },
];

// Curated icon set for the "add category" creator.
export const CATEGORY_ICON_CHOICES: string[] = [
  '🍜', '🍔', '🍕', '🍎', '🥗', '☕', '🍺', '🍰',
  '🚇', '🚌', '🚗', '⛽', '✈️', '🛍️', '👕', '💄',
  '🎮', '🎬', '🎵', '📚', '🏠', '💡', '🧾', '🐶',
  '💊', '💪', '🎁', '💝', '✂️', '📦', '💰', '⭐',
];

// Butter-theme swatches for custom category colors.
export const CATEGORY_COLOR_CHOICES: string[] = [
  '#F5C45E', '#E3C49A', '#A8D8C8', '#F4A6A0',
  '#C4A8D8', '#A8C4D8', '#D8A8C4', '#C4D8A8',
  '#E8A87C', '#9C8772',
];
