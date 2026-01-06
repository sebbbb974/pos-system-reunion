<script lang="ts">
  import { onMount } from 'svelte';
  import CategoryTabs from '$lib/components/CategoryTabs.svelte';
  import ProductGrid from '$lib/components/ProductGrid.svelte';
  import CartPanel from '$lib/components/CartPanel.svelte';
  import PaymentModal from '$lib/components/PaymentModal.svelte';
  import ReceiptModal from '$lib/components/ReceiptModal.svelte';
  import type { Transaction } from '$lib/types';

  let showPaymentModal = false;
  let showReceiptModal = false;
  let lastTransaction: Transaction | null = null;

  // Gestion du redimensionnement du panier
  const MIN_CART_WIDTH = 280;
  const MAX_CART_WIDTH = 600;
  const DEFAULT_CART_WIDTH = 384; // w-96 = 24rem = 384px

  let cartWidth = DEFAULT_CART_WIDTH;
  let isResizing = false;
  let containerRef: HTMLDivElement;

  onMount(() => {
    // Charger la largeur sauvegardée
    const saved = localStorage.getItem('pos_cart_width');
    if (saved) {
      const width = parseInt(saved);
      if (width >= MIN_CART_WIDTH && width <= MAX_CART_WIDTH) {
        cartWidth = width;
      }
    }
  });

  function startResize(e: MouseEvent | TouchEvent) {
    isResizing = true;
    e.preventDefault();

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizing || !containerRef) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const containerRect = containerRef.getBoundingClientRect();
      const newWidth = containerRect.right - clientX;

      cartWidth = Math.min(MAX_CART_WIDTH, Math.max(MIN_CART_WIDTH, newWidth));
    };

    const handleEnd = () => {
      isResizing = false;
      // Sauvegarder la préférence
      localStorage.setItem('pos_cart_width', cartWidth.toString());
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  }

  function openPayment() {
    showPaymentModal = true;
  }

  function closePayment() {
    showPaymentModal = false;
  }

  function handlePaymentSuccess(event: CustomEvent<Transaction>) {
    lastTransaction = event.detail;
    showPaymentModal = false;
    showReceiptModal = true;
  }

  function closeReceipt() {
    showReceiptModal = false;
    lastTransaction = null;
  }
</script>

<svelte:head>
  <title>Caisse - POS System</title>
</svelte:head>

<div class="flex h-full" bind:this={containerRef}>
  <!-- Zone principale (produits) -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Onglets catégories -->
    <CategoryTabs />

    <!-- Grille de produits -->
    <ProductGrid />
  </div>

  <!-- Panneau panier redimensionnable (côté droit) -->
  <div class="relative flex-shrink-0 flex" style="width: {cartWidth}px">
    <!-- Poignée de redimensionnement -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="resize-handle"
      class:resizing={isResizing}
      on:mousedown={startResize}
      on:touchstart={startResize}
      role="slider"
      aria-valuenow={cartWidth}
      aria-valuemin={MIN_CART_WIDTH}
      aria-valuemax={MAX_CART_WIDTH}
      aria-label="Largeur du panier"
      tabindex="0"
    >
      <div class="resize-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <!-- Contenu du panier -->
    <div class="flex-1 border-l border-pos-accent">
      <CartPanel onPayment={openPayment} />
    </div>
  </div>
</div>

<!-- Overlay pendant le redimensionnement pour éviter les interférences -->
{#if isResizing}
  <div class="fixed inset-0 z-50 cursor-col-resize"></div>
{/if}

<!-- Modal de paiement -->
{#if showPaymentModal}
  <PaymentModal
    on:close={closePayment}
    on:success={handlePaymentSuccess}
  />
{/if}

<!-- Modal de ticket -->
{#if showReceiptModal && lastTransaction}
  <ReceiptModal
    transaction={lastTransaction}
    on:close={closeReceipt}
  />
{/if}

<style>
  .resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 12px;
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: background-color 0.15s ease;
  }

  .resize-handle:hover,
  .resize-handle.resizing {
    background-color: rgba(233, 69, 96, 0.2);
  }

  .resize-indicator {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px 2px;
    border-radius: 4px;
    opacity: 0.4;
    transition: opacity 0.15s ease;
  }

  .resize-handle:hover .resize-indicator,
  .resize-handle.resizing .resize-indicator {
    opacity: 1;
  }

  .resize-indicator span {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: var(--pos-primary);
  }
</style>
