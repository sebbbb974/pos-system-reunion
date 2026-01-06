import { writable, derived, get } from 'svelte/store';
import type { Product, CategoryType } from '$lib/types';
import { defaultProducts, generateProductId } from '$lib/data/products';

// Store des produits
function createProductsStore() {
  // Charger depuis localStorage si disponible
  const stored = typeof localStorage !== 'undefined'
    ? localStorage.getItem('pos_products')
    : null;

  const initial: Product[] = stored ? JSON.parse(stored) : defaultProducts;

  const { subscribe, set, update } = writable<Product[]>(initial);

  // Sauvegarder dans localStorage à chaque modification
  const save = (products: Product[]) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pos_products', JSON.stringify(products));
    }
  };

  return {
    subscribe,

    // Ajouter un produit
    add: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      update(products => {
        const newProduct: Product = {
          ...product,
          id: generateProductId(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const updated = [...products, newProduct];
        save(updated);
        return updated;
      });
    },

    // Modifier un produit
    update: (id: string, changes: Partial<Product>) => {
      update(products => {
        const updated = products.map(p =>
          p.id === id
            ? { ...p, ...changes, updatedAt: new Date() }
            : p
        );
        save(updated);
        return updated;
      });
    },

    // Supprimer un produit
    delete: (id: string) => {
      update(products => {
        const updated = products.filter(p => p.id !== id);
        save(updated);
        return updated;
      });
    },

    // Activer/Désactiver un produit
    toggleActive: (id: string) => {
      update(products => {
        const updated = products.map(p =>
          p.id === id
            ? { ...p, isActive: !p.isActive, updatedAt: new Date() }
            : p
        );
        save(updated);
        return updated;
      });
    },

    // Mettre à jour le stock
    updateStock: (id: string, quantity: number) => {
      update(products => {
        const updated = products.map(p =>
          p.id === id && p.stock !== undefined
            ? { ...p, stock: Math.max(0, p.stock + quantity), updatedAt: new Date() }
            : p
        );
        save(updated);
        return updated;
      });
    },

    // Décrémenter le stock après une vente
    decrementStock: (id: string, quantity: number = 1) => {
      update(products => {
        const updated = products.map(p =>
          p.id === id && p.stock !== undefined
            ? { ...p, stock: Math.max(0, p.stock - quantity), updatedAt: new Date() }
            : p
        );
        save(updated);
        return updated;
      });
    },

    // Réinitialiser avec les produits par défaut
    reset: () => {
      set(defaultProducts);
      save(defaultProducts);
    },

    // Obtenir un produit par ID
    getById: (id: string): Product | undefined => {
      return get({ subscribe }).find(p => p.id === id);
    },

    // Obtenir les produits par catégorie
    getByCategory: (category: CategoryType): Product[] => {
      return get({ subscribe }).filter(p => p.category === category && p.isActive);
    }
  };
}

export const productsStore = createProductsStore();

// Store dérivé pour les produits actifs
export const activeProducts = derived(productsStore, ($products) =>
  $products.filter(p => p.isActive)
);

// Store pour la catégorie sélectionnée
export const selectedCategory = writable<CategoryType | 'all'>('all');

// Store dérivé pour les produits filtrés
export const filteredProducts = derived(
  [activeProducts, selectedCategory],
  ([$products, $category]) => {
    if ($category === 'all') {
      return $products;
    }
    return $products.filter(p => p.category === $category);
  }
);
