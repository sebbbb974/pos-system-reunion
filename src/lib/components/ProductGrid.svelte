<script lang="ts">
  import { filteredProducts } from '$lib/stores/products';
  import { cartItems } from '$lib/stores/cart';
  import { getCategoryColor, getCategoryIcon } from '$lib/data/categories';
  import type { Product } from '$lib/types';

  let lastAddedId: string | null = null;

  function addToCart(product: Product) {
    // Feedback visuel
    lastAddedId = product.id;
    setTimeout(() => {
      if (lastAddedId === product.id) lastAddedId = null;
    }, 300);

    // Feedback haptique (si disponible)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    cartItems.addItem(product);
  }

  function formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' €';
  }

  // Couleurs de catégories avec plus de saturation
  function getEnhancedColor(category: string): string {
    const colors: Record<string, string> = {
      repas: '#e74c3c',
      boissons: '#3498db',
      boissons_alcool: '#9b59b6',
      desserts: '#e67e22',
      sandwichs: '#f39c12',
      glaces: '#1abc9c',
      formules: '#8e44ad',
      snacks: '#27ae60',
      autres: '#7f8c8d'
    };
    return colors[category] || '#7f8c8d';
  }
</script>

<div class="flex-1 overflow-y-auto p-4">
  {#if $filteredProducts.length === 0}
    <div class="empty-state">
      <div class="empty-icon">🍽️</div>
      <p class="empty-title">Aucun produit</p>
      <p class="empty-subtitle">Sélectionnez une catégorie ou ajoutez des produits</p>
    </div>
  {:else}
    <div class="products-grid">
      {#each $filteredProducts as product (product.id)}
        {@const baseColor = getEnhancedColor(product.category)}
        <button
          class="product-card"
          class:just-added={lastAddedId === product.id}
          class:out-of-stock={product.stock !== undefined && product.stock === 0}
          style="--card-color: {baseColor}"
          on:click={() => addToCart(product)}
          disabled={product.stock !== undefined && product.stock === 0}
        >
          <!-- Fond dégradé -->
          <div class="card-bg"></div>

          <!-- Effet de brillance -->
          <div class="card-shine"></div>

          <!-- Contenu -->
          <div class="card-content">
            <!-- Icône catégorie -->
            <span class="card-emoji">{getCategoryIcon(product.category)}</span>

            <!-- Nom du produit -->
            <span class="card-name">{product.name}</span>

            <!-- Prix -->
            <div class="card-price">
              {formatPrice(product.price)}
            </div>
          </div>

          <!-- Badge stock bas -->
          {#if product.stock !== undefined && product.stock <= (product.minStock || 0) && product.stock > 0}
            <div class="badge-stock-low">
              <span>⚠️</span>
              <span>{product.stock}</span>
            </div>
          {/if}

          <!-- Overlay rupture -->
          {#if product.stock !== undefined && product.stock === 0}
            <div class="overlay-rupture">
              <span>RUPTURE</span>
            </div>
          {/if}

          <!-- Effet d'ajout au panier -->
          {#if lastAddedId === product.id}
            <div class="add-effect">✓</div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Grid Layout */
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
    padding-bottom: 1rem;
  }

  @media (min-width: 1400px) {
    .products-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
  }

  /* Product Card */
  .product-card {
    position: relative;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    overflow: hidden;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }

  .product-card:hover:not(:disabled) {
    transform: translateY(-6px) scale(1.02);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 0 30px color-mix(in srgb, var(--card-color) 30%, transparent);
  }

  .product-card:active:not(:disabled) {
    transform: scale(0.95);
  }

  .product-card:disabled {
    cursor: not-allowed;
  }

  /* Background gradient */
  .card-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      145deg,
      var(--card-color) 0%,
      color-mix(in srgb, var(--card-color) 80%, black) 100%
    );
  }

  /* Shine effect */
  .card-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.25) 0%,
      transparent 40%,
      transparent 60%,
      rgba(0, 0, 0, 0.1) 100%
    );
    pointer-events: none;
  }

  /* Border overlay */
  .product-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    pointer-events: none;
  }

  /* Content */
  .card-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 1rem 0.75rem;
    gap: 0.5rem;
  }

  .card-emoji {
    font-size: 2rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .card-name {
    font-size: 0.9rem;
    font-weight: 700;
    color: white;
    text-align: center;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .card-price {
    font-size: 1rem;
    font-weight: 800;
    color: white;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    padding: 0.35rem 0.75rem;
    border-radius: 10px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  /* Stock warning badge */
  .badge-stock-low {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #f1c40f;
    z-index: 2;
  }

  /* Out of stock overlay */
  .overlay-rupture {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
  }

  .overlay-rupture span {
    background: #e74c3c;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .out-of-stock {
    filter: grayscale(0.5);
  }

  /* Add to cart effect */
  .add-effect {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(46, 204, 113, 0.9);
    font-size: 2.5rem;
    color: white;
    z-index: 5;
    animation: popIn 0.3s ease-out;
  }

  @keyframes popIn {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
    100% {
      opacity: 0;
      transform: scale(1);
    }
  }

  .just-added {
    animation: bounce 0.3s ease;
  }

  @keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(0.92); }
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 2rem;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 0.5rem;
  }

  .empty-subtitle {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.4);
  }
</style>
