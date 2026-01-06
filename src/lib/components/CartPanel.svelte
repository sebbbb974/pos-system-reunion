<script lang="ts">
  import { cart, cartItems } from '$lib/stores/cart';
  import type { CartItem } from '$lib/types';

  export let onPayment: () => void;

  function formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' €';
  }

  function increment(productId: string) {
    const item = $cart.items.find(i => i.product.id === productId);
    if (item) {
      cartItems.addItem(item.product);
    }
  }

  function decrement(productId: string) {
    cartItems.removeItem(productId);
  }

  function deleteItem(productId: string) {
    cartItems.deleteItem(productId);
  }

  function clearCart() {
    cartItems.clear();
  }
</script>

<div class="flex flex-col h-full bg-pos-darker">
  <!-- En-tête -->
  <div class="flex items-center justify-between p-3 border-b border-pos-accent">
    <h2 class="text-lg font-bold text-pos-text flex items-center gap-2">
      <span>🧾</span> Ticket
    </h2>
    {#if $cart.itemCount > 0}
      <button
        class="text-sm text-pos-danger hover:text-red-400 transition-colors"
        on:click={clearCart}
      >
        Vider
      </button>
    {/if}
  </div>

  <!-- Liste des articles -->
  <div class="flex-1 overflow-y-auto p-3">
    {#if $cart.items.length === 0}
      <div class="flex flex-col items-center justify-center h-full text-gray-500">
        <span class="text-5xl mb-3">🛒</span>
        <p class="text-sm">Panier vide</p>
        <p class="text-xs mt-1">Appuyez sur un produit pour l'ajouter</p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each $cart.items as item (item.product.id)}
          <div class="cart-item">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-pos-text truncate">{item.product.name}</p>
              <p class="text-sm text-gray-400">
                {formatPrice(item.product.price)} × {item.quantity}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <div class="flex items-center bg-pos-accent rounded-lg">
                <button
                  class="qty-btn"
                  on:click={() => decrement(item.product.id)}
                >
                  −
                </button>
                <span class="w-8 text-center font-bold">{item.quantity}</span>
                <button
                  class="qty-btn"
                  on:click={() => increment(item.product.id)}
                >
                  +
                </button>
              </div>

              <span class="font-bold text-pos-text min-w-[70px] text-right">
                {formatPrice(item.subtotal)}
              </span>

              <button
                class="delete-btn"
                on:click={() => deleteItem(item.product.id)}
                title="Supprimer"
              >
                ×
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Totaux -->
  <div class="border-t border-pos-accent p-3 space-y-2">
    <div class="flex justify-between text-sm text-gray-400">
      <span>Sous-total HT</span>
      <span>{formatPrice($cart.subtotal)}</span>
    </div>
    <div class="flex justify-between text-sm text-gray-400">
      <span>TVA</span>
      <span>{formatPrice($cart.totalVat)}</span>
    </div>
    <div class="flex justify-between text-xl font-bold text-pos-text pt-2 border-t border-pos-accent">
      <span>TOTAL TTC</span>
      <span class="text-pos-success">{formatPrice($cart.total)}</span>
    </div>

    <!-- Bouton de paiement -->
    <button
      class="w-full py-4 mt-3 rounded-xl font-bold text-xl transition-all
             {$cart.itemCount > 0
               ? 'bg-pos-success text-pos-dark hover:bg-green-400 active:scale-98'
               : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
      disabled={$cart.itemCount === 0}
      on:click={onPayment}
    >
      💳 ENCAISSER
    </button>
  </div>
</div>

<style>
  .cart-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--pos-accent);
    border-radius: 0.75rem;
  }

  .qty-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--pos-text);
    transition: all 0.1s ease;
  }

  .qty-btn:hover {
    background: var(--pos-primary);
    border-radius: 0.5rem;
  }

  .qty-btn:active {
    transform: scale(0.9);
  }

  .delete-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: var(--pos-danger);
    opacity: 0.7;
    transition: all 0.1s ease;
  }

  .delete-btn:hover {
    opacity: 1;
    transform: scale(1.1);
  }
</style>
