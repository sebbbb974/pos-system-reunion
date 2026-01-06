<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { cart, processPayment } from '$lib/stores/cart';
  import type { PaymentMethod, Transaction } from '$lib/types';

  const dispatch = createEventDispatcher<{
    close: void;
    success: Transaction;
  }>();

  let selectedMethod: PaymentMethod = 'card';
  let cashGiven: string = '';
  let isProcessing = false;

  $: total = $cart.total;
  $: cashAmount = parseFloat(cashGiven) || 0;
  $: change = cashAmount - total;
  $: canPay = selectedMethod !== 'cash' || cashAmount >= total;

  function formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' €';
  }

  function selectMethod(method: PaymentMethod) {
    selectedMethod = method;
    if (method !== 'cash') {
      cashGiven = '';
    }
  }

  function addCash(amount: number) {
    const current = parseFloat(cashGiven) || 0;
    cashGiven = (current + amount).toFixed(2);
  }

  function setCash(amount: number) {
    cashGiven = amount.toFixed(2);
  }

  function clearCash() {
    cashGiven = '';
  }

  async function handlePayment() {
    if (!canPay || isProcessing) return;

    isProcessing = true;

    try {
      const transaction = processPayment(
        selectedMethod,
        selectedMethod === 'cash' ? cashAmount : undefined
      );

      // Simuler un délai pour le feedback
      await new Promise(resolve => setTimeout(resolve, 300));

      dispatch('success', transaction);
    } catch (error) {
      console.error('Erreur de paiement:', error);
      alert('Erreur lors du paiement');
    } finally {
      isProcessing = false;
    }
  }

  function close() {
    dispatch('close');
  }

  // Quick cash buttons
  const quickCashButtons = [5, 10, 20, 50];
</script>

<!-- Overlay -->
<div
  class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
  on:click={close}
  on:keydown={(e) => e.key === 'Escape' && close()}
  role="dialog"
  aria-modal="true"
>
  <!-- Modal -->
  <div
    class="bg-pos-darker rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
    on:click|stopPropagation
    on:keydown|stopPropagation
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-pos-accent">
      <h2 class="text-2xl font-bold text-pos-text">💳 Encaissement</h2>
      <button
        class="w-10 h-10 rounded-full bg-pos-accent text-pos-text flex items-center justify-center text-2xl hover:bg-pos-primary transition-colors"
        on:click={close}
      >
        ×
      </button>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Total -->
      <div class="text-center mb-6">
        <p class="text-gray-400 text-lg">Total à payer</p>
        <p class="text-5xl font-bold text-pos-success">{formatPrice(total)}</p>
      </div>

      <!-- Méthodes de paiement -->
      <div class="grid grid-cols-4 gap-3 mb-6">
        <button
          class="payment-method"
          class:selected={selectedMethod === 'card'}
          on:click={() => selectMethod('card')}
        >
          <span class="text-3xl">💳</span>
          <span class="text-sm font-medium">Carte</span>
        </button>
        <button
          class="payment-method"
          class:selected={selectedMethod === 'cash'}
          on:click={() => selectMethod('cash')}
        >
          <span class="text-3xl">💵</span>
          <span class="text-sm font-medium">Espèces</span>
        </button>
        <button
          class="payment-method"
          class:selected={selectedMethod === 'cheque'}
          on:click={() => selectMethod('cheque')}
        >
          <span class="text-3xl">📝</span>
          <span class="text-sm font-medium">Chèque</span>
        </button>
        <button
          class="payment-method"
          class:selected={selectedMethod === 'ticket'}
          on:click={() => selectMethod('ticket')}
        >
          <span class="text-3xl">🎫</span>
          <span class="text-sm font-medium">Ticket Resto</span>
        </button>
      </div>

      <!-- Section espèces -->
      {#if selectedMethod === 'cash'}
        <div class="bg-pos-dark rounded-xl p-4 mb-6">
          <p class="text-gray-400 mb-3">Montant reçu</p>

          <!-- Input espèces -->
          <div class="flex items-center gap-3 mb-4">
            <input
              type="number"
              bind:value={cashGiven}
              placeholder="0,00"
              class="flex-1 bg-pos-accent text-pos-text text-3xl font-bold p-4 rounded-xl text-center outline-none focus:ring-2 focus:ring-pos-primary"
              step="0.01"
              min="0"
            />
            <span class="text-3xl text-pos-text">€</span>
          </div>

          <!-- Boutons rapides -->
          <div class="grid grid-cols-4 gap-2 mb-4">
            {#each quickCashButtons as amount}
              <button
                class="quick-cash-btn"
                on:click={() => addCash(amount)}
              >
                +{amount}€
              </button>
            {/each}
          </div>

          <!-- Montant exact / Arrondi -->
          <div class="grid grid-cols-3 gap-2">
            <button
              class="quick-cash-btn bg-pos-accent"
              on:click={() => setCash(total)}
            >
              Exact
            </button>
            <button
              class="quick-cash-btn bg-pos-accent"
              on:click={() => setCash(Math.ceil(total / 5) * 5)}
            >
              Arrondi 5€
            </button>
            <button
              class="quick-cash-btn bg-pos-danger/30 text-pos-danger"
              on:click={clearCash}
            >
              Effacer
            </button>
          </div>

          <!-- Rendu de monnaie -->
          {#if cashAmount > 0}
            <div class="mt-4 p-4 bg-pos-accent rounded-xl text-center">
              <p class="text-gray-400">Rendu monnaie</p>
              <p class="text-3xl font-bold {change >= 0 ? 'text-pos-success' : 'text-pos-danger'}">
                {formatPrice(Math.max(0, change))}
              </p>
              {#if change < 0}
                <p class="text-pos-danger text-sm mt-1">
                  Montant insuffisant ({formatPrice(Math.abs(change))} manquant)
                </p>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Bouton de validation -->
      <button
        class="w-full py-5 rounded-xl font-bold text-2xl transition-all
               {canPay && !isProcessing
                 ? 'bg-pos-success text-pos-dark hover:bg-green-400 active:scale-98'
                 : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
        disabled={!canPay || isProcessing}
        on:click={handlePayment}
      >
        {#if isProcessing}
          ⏳ Traitement...
        {:else}
          ✓ VALIDER LE PAIEMENT
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .payment-method {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: var(--pos-accent);
    border-radius: 0.75rem;
    border: 2px solid transparent;
    transition: all 0.15s ease;
    color: var(--pos-text);
  }

  .payment-method:hover {
    background: var(--pos-dark);
  }

  .payment-method.selected {
    background: var(--pos-primary);
    border-color: var(--pos-text);
  }

  .quick-cash-btn {
    padding: 0.75rem;
    background: var(--pos-primary);
    color: white;
    font-weight: 600;
    border-radius: 0.5rem;
    transition: all 0.1s ease;
  }

  .quick-cash-btn:hover {
    opacity: 0.9;
  }

  .quick-cash-btn:active {
    transform: scale(0.95);
  }

  /* Cacher les flèches du input number */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
</style>
