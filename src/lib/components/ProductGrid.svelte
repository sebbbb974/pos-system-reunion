<script lang="ts">
  import { filteredProducts } from '$lib/stores/products';
  import { cartItems } from '$lib/stores/cart';
  import { getCategoryColor } from '$lib/data/categories';
  import type { Product } from '$lib/types';

  function addToCart(product: Product) {
    // Feedback sonore (si disponible)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    cartItems.addItem(product);
  }

  function formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' €';
  }
</script>

<div class="flex-1 overflow-y-auto p-3">
  {#if $filteredProducts.length === 0}
    <div class="flex flex-col items-center justify-center h-full text-gray-400">
      <span class="text-6xl mb-4">📦</span>
      <p class="text-xl">Aucun produit dans cette catégorie</p>
    </div>
  {:else}
    <div class="product-grid">
      {#each $filteredProducts as product (product.id)}
        <button
          class="product-btn"
          style="background-color: {getCategoryColor(product.category)}"
          on:click={() => addToCart(product)}
          disabled={product.stock !== undefined && product.stock === 0}
        >
          <span class="product-name">{product.name}</span>
          <span class="product-price">{formatPrice(product.price)}</span>
          {#if product.stock !== undefined && product.stock <= (product.minStock || 0)}
            <span class="stock-warning" title="Stock bas">⚠️</span>
          {/if}
          {#if product.stock !== undefined && product.stock === 0}
            <span class="out-of-stock">Rupture</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .product-btn {
    position: relative;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    border-radius: 0.75rem;
    font-weight: 600;
    text-align: center;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    border: none;
    transition: all 0.15s ease;
    min-height: 100px;
  }

  .product-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  }

  .product-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .product-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .product-name {
    font-size: 0.9rem;
    line-height: 1.2;
    margin-bottom: 0.5rem;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .product-price {
    font-size: 1rem;
    font-weight: 700;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
  }

  .stock-warning {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    font-size: 1rem;
  }

  .out-of-stock {
    position: absolute;
    bottom: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.7rem;
    text-transform: uppercase;
  }
</style>
