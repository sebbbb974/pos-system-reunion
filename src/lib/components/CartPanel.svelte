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

<div class="cart-container">
  <!-- En-tête avec effet glass -->
  <div class="cart-header">
    <div class="header-title">
      <span class="header-icon">🧾</span>
      <div>
        <h2>Ticket</h2>
        {#if $cart.itemCount > 0}
          <span class="item-count">{$cart.itemCount} article{$cart.itemCount > 1 ? 's' : ''}</span>
        {/if}
      </div>
    </div>
    {#if $cart.itemCount > 0}
      <button class="clear-btn" on:click={clearCart}>
        <span>🗑️</span>
        <span>Vider</span>
      </button>
    {/if}
  </div>

  <!-- Liste des articles -->
  <div class="cart-items">
    {#if $cart.items.length === 0}
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p class="empty-title">Panier vide</p>
        <p class="empty-subtitle">Touchez un produit pour l'ajouter</p>
      </div>
    {:else}
      <div class="items-list">
        {#each $cart.items as item, index (item.product.id)}
          <div class="cart-item slide-up" style="animation-delay: {index * 0.05}s">
            <!-- Info produit -->
            <div class="item-info">
              <p class="item-name">{item.product.name}</p>
              <p class="item-price-unit">{formatPrice(item.product.price)} / unité</p>
            </div>

            <!-- Contrôles -->
            <div class="item-controls">
              <!-- Quantité -->
              <div class="qty-control">
                <button class="qty-btn minus" on:click={() => decrement(item.product.id)}>
                  <svg width="14" height="2" viewBox="0 0 14 2" fill="currentColor">
                    <rect width="14" height="2" rx="1"/>
                  </svg>
                </button>
                <span class="qty-value">{item.quantity}</span>
                <button class="qty-btn plus" on:click={() => increment(item.product.id)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <rect x="6" width="2" height="14" rx="1"/>
                    <rect y="6" width="14" height="2" rx="1"/>
                  </svg>
                </button>
              </div>

              <!-- Prix total -->
              <span class="item-total">{formatPrice(item.subtotal)}</span>

              <!-- Supprimer -->
              <button class="delete-btn" on:click={() => deleteItem(item.product.id)} title="Supprimer">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.5 3V2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1h3a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 4H1.5a.5.5 0 0 1 0-1h3zm2-1a1 1 0 0 0-1 1h5a1 1 0 0 0-1-1h-3z"/>
                </svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Totaux -->
  <div class="cart-footer">
    <!-- Détails TVA -->
    <div class="totals-detail">
      <div class="total-row">
        <span>Sous-total HT</span>
        <span>{formatPrice($cart.subtotal)}</span>
      </div>
      <div class="total-row">
        <span>TVA</span>
        <span>{formatPrice($cart.totalVat)}</span>
      </div>
    </div>

    <!-- Total principal -->
    <div class="total-main">
      <span>TOTAL</span>
      <span class="total-amount">{formatPrice($cart.total)}</span>
    </div>

    <!-- Bouton de paiement -->
    <button
      class="pay-btn"
      class:disabled={$cart.itemCount === 0}
      disabled={$cart.itemCount === 0}
      on:click={onPayment}
    >
      <span class="pay-icon">💳</span>
      <span class="pay-text">ENCAISSER</span>
      {#if $cart.itemCount > 0}
        <span class="pay-amount">{formatPrice($cart.total)}</span>
      {/if}
    </button>
  </div>
</div>

<style>
  .cart-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: linear-gradient(180deg, rgba(18, 18, 43, 0.98) 0%, rgba(12, 12, 30, 0.98) 100%);
  }

  /* Header */
  .cart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-icon {
    font-size: 1.5rem;
  }

  .header-title h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    line-height: 1.2;
  }

  .item-count {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .clear-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    background: rgba(231, 76, 60, 0.15);
    border: 1px solid rgba(231, 76, 60, 0.3);
    border-radius: 8px;
    color: #e74c3c;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .clear-btn:hover {
    background: rgba(231, 76, 60, 0.25);
  }

  /* Cart Items */
  .cart-items {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cart-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.875rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .cart-item:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .item-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: white;
    line-height: 1.3;
  }

  .item-price-unit {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .item-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  /* Quantity Control */
  .qty-control {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    overflow: hidden;
  }

  .qty-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.15s ease;
  }

  .qty-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .qty-btn.minus:hover {
    background: rgba(231, 76, 60, 0.3);
    color: #e74c3c;
  }

  .qty-btn.plus:hover {
    background: rgba(46, 204, 113, 0.3);
    color: #2ecc71;
  }

  .qty-btn:active {
    transform: scale(0.9);
  }

  .qty-value {
    width: 2rem;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 700;
    color: white;
  }

  .item-total {
    flex: 1;
    text-align: right;
    font-size: 1rem;
    font-weight: 700;
    color: white;
  }

  .delete-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(231, 76, 60, 0.6);
    border-radius: 8px;
    transition: all 0.15s ease;
  }

  .delete-btn:hover {
    background: rgba(231, 76, 60, 0.2);
    color: #e74c3c;
  }

  /* Empty State */
  .empty-cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    text-align: center;
  }

  .empty-icon {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    opacity: 0.3;
  }

  .empty-title {
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 0.25rem;
  }

  .empty-subtitle {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.3);
  }

  /* Footer */
  .cart-footer {
    padding: 1rem 1.25rem;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .totals-detail {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .total-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .total-main span:first-child {
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
  }

  .total-amount {
    font-size: 1.75rem;
    font-weight: 800;
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Pay Button */
  .pay-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
  }

  .pay-btn:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(46, 204, 113, 0.4);
  }

  .pay-btn:active:not(.disabled) {
    transform: scale(0.98);
  }

  .pay-btn.disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.3);
    box-shadow: none;
    cursor: not-allowed;
  }

  .pay-icon {
    font-size: 1.25rem;
  }

  .pay-amount {
    margin-left: auto;
    padding-left: 1rem;
    border-left: 1px solid rgba(255, 255, 255, 0.3);
  }
</style>
