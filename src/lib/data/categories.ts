import type { Category, CategoryType } from '$lib/types';

export const categories: Category[] = [
  {
    id: 'repas',
    name: 'Repas',
    color: '#ef4444',
    icon: '🍽️'
  },
  {
    id: 'boissons',
    name: 'Boissons',
    color: '#3b82f6',
    icon: '🥤'
  },
  {
    id: 'boissons_alcool',
    name: 'Alcools',
    color: '#7c3aed',
    icon: '🍺'
  },
  {
    id: 'sandwichs',
    name: 'Sandwichs',
    color: '#eab308',
    icon: '🥪'
  },
  {
    id: 'desserts',
    name: 'Desserts',
    color: '#f97316',
    icon: '🍰'
  },
  {
    id: 'glaces',
    name: 'Glaces',
    color: '#06b6d4',
    icon: '🍦'
  },
  {
    id: 'formules',
    name: 'Formules',
    color: '#8b5cf6',
    icon: '📦'
  },
  {
    id: 'snacks',
    name: 'Snacks',
    color: '#22c55e',
    icon: '🍿'
  },
  {
    id: 'autres',
    name: 'Autres',
    color: '#6b7280',
    icon: '📋'
  }
];

export const getCategoryById = (id: CategoryType): Category | undefined => {
  return categories.find(cat => cat.id === id);
};

export const getCategoryColor = (id: CategoryType): string => {
  return getCategoryById(id)?.color || '#6b7280';
};
