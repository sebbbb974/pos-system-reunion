import { writable, derived, get } from 'svelte/store';
import type { Product, CartItem, Cart, Transaction, PaymentMethod } from '$lib/types';
import { transactionsStore } from './transactions';

// Store du panier
function createCartStore() {
  const { subscribe, set, update } = writable<CartItem[]>([]);

  return {
    subscribe,

    // Ajouter un produit au panier
    addItem: (product: Product) => {
      update(items => {
        const existingItem = items.find(item => item.product.id === product.id);

        if (existingItem) {
          // Incrémenter la quantité si le produit existe déjà
          return items.map(item =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  subtotal: (item.quantity + 1) * item.product.price,
                  vatAmount: ((item.quantity + 1) * item.product.price * item.product.vatRate) / (100 + item.product.vatRate)
                }
              : item
          );
        } else {
          // Ajouter un nouveau produit
          const vatAmount = (product.price * product.vatRate) / (100 + product.vatRate);
          return [...items, {
            product,
            quantity: 1,
            subtotal: product.price,
            vatAmount
          }];
        }
      });
    },

    // Retirer un produit du panier
    removeItem: (productId: string) => {
      update(items => {
        const existingItem = items.find(item => item.product.id === productId);

        if (existingItem && existingItem.quantity > 1) {
          // Décrémenter la quantité
          return items.map(item =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity: item.quantity - 1,
                  subtotal: (item.quantity - 1) * item.product.price,
                  vatAmount: ((item.quantity - 1) * item.product.price * item.product.vatRate) / (100 + item.product.vatRate)
                }
              : item
          );
        } else {
          // Supprimer le produit si quantité = 1
          return items.filter(item => item.product.id !== productId);
        }
      });
    },

    // Supprimer complètement un produit du panier
    deleteItem: (productId: string) => {
      update(items => items.filter(item => item.product.id !== productId));
    },

    // Modifier la quantité d'un produit
    setQuantity: (productId: string, quantity: number) => {
      if (quantity <= 0) {
        update(items => items.filter(item => item.product.id !== productId));
      } else {
        update(items => items.map(item =>
          item.product.id === productId
            ? {
                ...item,
                quantity,
                subtotal: quantity * item.product.price,
                vatAmount: (quantity * item.product.price * item.product.vatRate) / (100 + item.product.vatRate)
              }
            : item
        ));
      }
    },

    // Vider le panier
    clear: () => set([]),

    // Obtenir le panier actuel
    getItems: () => get({ subscribe })
  };
}

export const cartItems = createCartStore();

// Store dérivé pour les totaux du panier
export const cart = derived(cartItems, ($items): Cart => {
  const subtotal = $items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalVat = $items.reduce((sum, item) => sum + item.vatAmount, 0);
  const itemCount = $items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: $items,
    subtotal: subtotal - totalVat, // HT
    totalVat,
    total: subtotal, // TTC
    itemCount
  };
});

// Fonction pour valider une vente
export function processPayment(paymentMethod: PaymentMethod, cashGiven?: number): Transaction {
  const currentCart = get(cart);
  const items = get(cartItems);

  if (items.length === 0) {
    throw new Error('Le panier est vide');
  }

  const transaction: Transaction = {
    id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    items: [...items],
    subtotal: currentCart.subtotal,
    totalVat: currentCart.totalVat,
    total: currentCart.total,
    paymentMethod,
    cashGiven: paymentMethod === 'cash' ? cashGiven : undefined,
    change: paymentMethod === 'cash' && cashGiven ? cashGiven - currentCart.total : undefined,
    timestamp: new Date(),
    receiptNumber: generateReceiptNumber()
  };

  // Enregistrer la transaction
  transactionsStore.add(transaction);

  // Vider le panier
  cartItems.clear();

  return transaction;
}

// Génération du numéro de ticket
function generateReceiptNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${date}-${time}-${random}`;
}
