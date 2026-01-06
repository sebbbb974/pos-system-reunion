<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Transaction } from '$lib/types';

  export let transaction: Transaction;

  const dispatch = createEventDispatcher<{
    close: void;
    print: void;
  }>();

  function formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' €';
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      card: 'Carte bancaire',
      cash: 'Espèces',
      cheque: 'Chèque',
      ticket: 'Ticket restaurant'
    };
    return labels[method] || method;
  }

  function close() {
    dispatch('close');
  }

  function print() {
    dispatch('print');
    // Imprimer le ticket (à implémenter avec l'API d'impression)
    window.print();
  }
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
    class="bg-white text-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl"
    on:click|stopPropagation
    on:keydown|stopPropagation
  >
    <!-- Header -->
    <div class="bg-pos-success p-6 text-center">
      <span class="text-6xl">✓</span>
      <h2 class="text-2xl font-bold text-white mt-2">Paiement réussi !</h2>
    </div>

    <!-- Ticket -->
    <div class="p-6 receipt-content">
      <!-- En-tête du ticket -->
      <div class="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
        <h3 class="text-xl font-bold">VOTRE COMMERCE</h3>
        <p class="text-sm text-gray-500">123 Rue du Commerce</p>
        <p class="text-sm text-gray-500">97400 Saint-Denis</p>
        <p class="text-xs text-gray-400 mt-2">
          N° {transaction.receiptNumber}
        </p>
        <p class="text-xs text-gray-400">
          {formatDate(transaction.timestamp)}
        </p>
      </div>

      <!-- Articles -->
      <div class="space-y-2 border-b-2 border-dashed border-gray-300 pb-4 mb-4">
        {#each transaction.items as item}
          <div class="flex justify-between text-sm">
            <span>
              {item.quantity}x {item.product.name}
            </span>
            <span>{formatPrice(item.subtotal)}</span>
          </div>
          <div class="text-xs text-gray-400 pl-4">
            {formatPrice(item.product.price)} / unité · TVA {item.product.vatRate}%
          </div>
        {/each}
      </div>

      <!-- Totaux -->
      <div class="space-y-1 mb-4">
        <div class="flex justify-between text-sm text-gray-600">
          <span>Sous-total HT</span>
          <span>{formatPrice(transaction.subtotal)}</span>
        </div>
        <div class="flex justify-between text-sm text-gray-600">
          <span>TVA</span>
          <span>{formatPrice(transaction.totalVat)}</span>
        </div>
        <div class="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
          <span>TOTAL TTC</span>
          <span>{formatPrice(transaction.total)}</span>
        </div>
      </div>

      <!-- Paiement -->
      <div class="bg-gray-100 rounded-lg p-3 text-sm">
        <div class="flex justify-between">
          <span>Mode de paiement</span>
          <span class="font-medium">{getPaymentMethodLabel(transaction.paymentMethod)}</span>
        </div>
        {#if transaction.paymentMethod === 'cash' && transaction.cashGiven}
          <div class="flex justify-between mt-1">
            <span>Espèces reçues</span>
            <span>{formatPrice(transaction.cashGiven)}</span>
          </div>
          <div class="flex justify-between mt-1 font-bold">
            <span>Rendu monnaie</span>
            <span>{formatPrice(transaction.change || 0)}</span>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="text-center mt-4 text-xs text-gray-400">
        <p>Merci de votre visite !</p>
        <p>À bientôt</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="p-4 bg-gray-100 flex gap-3">
      <button
        class="flex-1 py-3 bg-pos-dark text-white rounded-xl font-medium hover:bg-pos-accent transition-colors"
        on:click={close}
      >
        Fermer
      </button>
      <button
        class="flex-1 py-3 bg-pos-primary text-white rounded-xl font-medium hover:bg-red-400 transition-colors flex items-center justify-center gap-2"
        on:click={print}
      >
        <span>🖨️</span> Imprimer
      </button>
    </div>
  </div>
</div>

<style>
  @media print {
    .receipt-content {
      display: block;
    }
    /* Masquer tout sauf le contenu du ticket lors de l'impression */
  }
</style>
