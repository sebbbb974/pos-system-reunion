<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { cart, cartItems } from '$lib/stores/cart';
  import { transactionsStore } from '$lib/stores/transactions';
  import type { PaymentMethod, Transaction, Discount, PaymentDetails } from '$lib/types';

  const dispatch = createEventDispatcher<{
    close: void;
    success: Transaction;
  }>();

  // États principaux
  let currentView: 'main' | 'cash' | 'ticket_resto' | 'mixed' | 'discount' | 'note' | 'split' = $state('main');
  let isProcessing = $state(false);

  // Paiement principal
  let selectedMethod: PaymentMethod = $state('card');

  // Paiement espèces
  let cashGiven: string = $state('');

  // Ticket restaurant
  let ticketRestoCount = $state(1);
  let ticketRestoValue = $state(8);

  // Paiement mixte
  let mixedCash = $state('');
  let mixedCard = $state('');
  let mixedTicket = $state('');

  // Remise
  let discountType: 'percent' | 'amount' | 'offered' = $state('percent');
  let discountValue = $state('');
  let discountReason = $state('');
  let activeDiscount: Discount | null = $state(null);

  // Note de frais
  let transactionNote = $state('');

  // Paiement partagé multi-personnes
  interface SplitPayer {
    id: string;
    name: string;
    amount: string;
    method: 'cash' | 'card' | 'ticket_resto';
    paid: boolean;
  }

  let splitPayers: SplitPayer[] = $state([
    { id: '1', name: 'Personne 1', amount: '', method: 'card', paid: false },
    { id: '2', name: 'Personne 2', amount: '', method: 'card', paid: false }
  ]);

  // Calculs
  const total = $derived($cart.total);
  const finalTotal = $derived(activeDiscount ? calculateFinalTotal(total, activeDiscount) : total);
  const cashAmount = $derived(parseFloat(cashGiven) || 0);
  const change = $derived(cashAmount - finalTotal);

  // Ticket resto calculs
  const ticketRestoTotal = $derived(ticketRestoCount * ticketRestoValue);
  const ticketRestoRemaining = $derived(finalTotal - ticketRestoTotal);

  // Paiement mixte calculs
  const mixedTotal = $derived((parseFloat(mixedCash) || 0) + (parseFloat(mixedCard) || 0) + (parseFloat(mixedTicket) || 0));
  const mixedRemaining = $derived(finalTotal - mixedTotal);

  // Paiement partagé calculs
  const splitTotal = $derived(splitPayers.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0));
  const splitRemaining = $derived(finalTotal - splitTotal);
  const splitAllPaid = $derived(splitPayers.every(p => p.paid) && Math.abs(splitRemaining) < 0.01);

  // Validation
  const canPayCash = $derived(cashAmount >= finalTotal);
  const canPayTicketResto = $derived(ticketRestoTotal >= finalTotal || ticketRestoRemaining <= 0);
  const canPayMixed = $derived(Math.abs(mixedRemaining) < 0.01);
  const canPaySplit = $derived(Math.abs(splitRemaining) < 0.01);

  function calculateFinalTotal(baseTotal: number, discount: Discount): number {
    if (discount.type === 'offered') return 0;
    if (discount.type === 'percent') return baseTotal * (1 - discount.value / 100);
    if (discount.type === 'amount') return Math.max(0, baseTotal - discount.value);
    return baseTotal;
  }

  function formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' €';
  }

  // Boutons de billets pour espèces
  const billButtons = [
    { value: 5, label: '5€', image: '💶' },
    { value: 10, label: '10€', image: '💶' },
    { value: 20, label: '20€', image: '💶' },
    { value: 50, label: '50€', image: '💶' },
    { value: 100, label: '100€', image: '💶' },
    { value: 200, label: '200€', image: '💶' },
  ];

  // Boutons rapides pour montant exact ou arrondi
  function setExactAmount() {
    cashGiven = finalTotal.toFixed(2);
  }

  function roundUp(multiple: number) {
    cashGiven = (Math.ceil(finalTotal / multiple) * multiple).toFixed(2);
  }

  function addBill(amount: number) {
    const current = parseFloat(cashGiven) || 0;
    cashGiven = (current + amount).toFixed(2);
  }

  function clearCash() {
    cashGiven = '';
  }

  // Appliquer une remise
  function applyDiscount() {
    const value = parseFloat(discountValue) || 0;
    if (value <= 0 && discountType !== 'offered') return;

    activeDiscount = {
      type: discountType,
      value: discountType === 'offered' ? 100 : value,
      reason: discountReason || undefined
    };
    currentView = 'main';
  }

  function removeDiscount() {
    activeDiscount = null;
    discountValue = '';
    discountReason = '';
  }

  // Offrir le ticket (gratuité)
  function offerTicket() {
    activeDiscount = {
      type: 'offered',
      value: 100,
      reason: 'Offert'
    };
    currentView = 'main';
  }

  // Ajouter un sac plastique
  function addPlasticBag() {
    const bagProduct = {
      id: 'sac-plastique-' + Date.now(),
      name: 'Sac plastique',
      price: 0.10,
      category: 'autres' as const,
      vatRate: 2.1 as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    cartItems.addItem(bagProduct);
  }

  // Ouvrir tiroir-caisse (simulation)
  function openCashDrawer() {
    alert('🗃️ Tiroir-caisse ouvert !');
  }

  // Génération du numéro de ticket
  function generateReceiptNumber(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${date}-${time}-${random}`;
  }

  // === Fonctions paiement partagé ===
  function addPayer() {
    const newId = (splitPayers.length + 1).toString();
    splitPayers = [...splitPayers, {
      id: newId,
      name: `Personne ${newId}`,
      amount: '',
      method: 'card',
      paid: false
    }];
  }

  function removePayer(id: string) {
    if (splitPayers.length > 2) {
      splitPayers = splitPayers.filter(p => p.id !== id);
    }
  }

  function splitEvenly() {
    const perPerson = (finalTotal / splitPayers.length).toFixed(2);
    splitPayers = splitPayers.map(p => ({ ...p, amount: perPerson }));
  }

  function markPayerPaid(id: string) {
    splitPayers = splitPayers.map(p =>
      p.id === id ? { ...p, paid: true } : p
    );
  }

  function markPayerUnpaid(id: string) {
    splitPayers = splitPayers.map(p =>
      p.id === id ? { ...p, paid: false } : p
    );
  }

  function updatePayerAmount(id: string, amount: string) {
    splitPayers = splitPayers.map(p =>
      p.id === id ? { ...p, amount } : p
    );
  }

  function updatePayerMethod(id: string, method: 'cash' | 'card' | 'ticket_resto') {
    splitPayers = splitPayers.map(p =>
      p.id === id ? { ...p, method } : p
    );
  }

  function updatePayerName(id: string, name: string) {
    splitPayers = splitPayers.map(p =>
      p.id === id ? { ...p, name } : p
    );
  }

  // Traiter le paiement
  async function processPayment() {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const items = $cart.items;
      if (items.length === 0) {
        throw new Error('Le panier est vide');
      }

      let paymentDetails: PaymentDetails | undefined;
      let method = selectedMethod;
      let cashGivenAmount: number | undefined;
      let changeAmount: number | undefined;

      // Construire les détails selon le mode de paiement
      if (currentView === 'cash' || selectedMethod === 'cash') {
        method = 'cash';
        cashGivenAmount = cashAmount;
        changeAmount = change > 0 ? change : 0;
      } else if (currentView === 'ticket_resto') {
        method = 'ticket_resto';
        paymentDetails = {
          ticketResto: ticketRestoTotal,
          ticketRestoCount: ticketRestoCount
        };
        if (ticketRestoRemaining > 0) {
          method = 'mixed';
          paymentDetails.cash = ticketRestoRemaining;
        }
      } else if (currentView === 'mixed') {
        method = 'mixed';
        paymentDetails = {
          cash: parseFloat(mixedCash) || undefined,
          card: parseFloat(mixedCard) || undefined,
          ticketResto: parseFloat(mixedTicket) || undefined
        };
      } else if (currentView === 'split') {
        method = 'mixed';
        // Compiler les paiements par méthode
        const cashTotal = splitPayers.filter(p => p.method === 'cash').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const cardTotal = splitPayers.filter(p => p.method === 'card').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const ticketTotal = splitPayers.filter(p => p.method === 'ticket_resto').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

        paymentDetails = {
          cash: cashTotal > 0 ? cashTotal : undefined,
          card: cardTotal > 0 ? cardTotal : undefined,
          ticketResto: ticketTotal > 0 ? ticketTotal : undefined,
          splitPayment: splitPayers.map(p => ({
            name: p.name,
            amount: parseFloat(p.amount) || 0,
            method: p.method
          }))
        };
      }

      const transaction: Transaction = {
        id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        items: [...items],
        subtotal: $cart.subtotal,
        totalVat: $cart.totalVat,
        total: total,
        finalTotal: finalTotal,
        discount: activeDiscount || undefined,
        paymentMethod: method,
        paymentDetails,
        cashGiven: cashGivenAmount,
        change: changeAmount,
        timestamp: new Date(),
        receiptNumber: generateReceiptNumber(),
        isOffered: activeDiscount?.type === 'offered',
        note: transactionNote || undefined
      };

      // Enregistrer la transaction
      transactionsStore.add(transaction);

      // Vider le panier
      cartItems.clear();

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

  // Paiement rapide par carte
  function quickCardPayment() {
    selectedMethod = 'card';
    currentView = 'main';
    processPayment();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
  onclick={close}
  onkeydown={(e) => e.key === 'Escape' && close()}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="bg-pos-darker rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-pos-accent shrink-0">
      <div class="flex items-center gap-3">
        <!-- Bouton Retour toujours visible -->
        <button
          class="flex items-center gap-2 px-4 py-2 bg-pos-accent text-pos-text rounded-lg hover:bg-pos-primary transition-colors"
          onclick={() => currentView !== 'main' ? currentView = 'main' : close()}
        >
          <span class="text-lg">←</span>
          <span class="font-medium">Retour</span>
        </button>
        <h2 class="text-xl font-bold text-pos-text">💳 Encaissement</h2>
      </div>
      <button
        class="w-10 h-10 rounded-full bg-pos-accent text-pos-text flex items-center justify-center text-2xl hover:bg-pos-danger transition-colors"
        onclick={close}
        title="Fermer"
      >
        ×
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Total et remise -->
      <div class="text-center mb-4">
        {#if activeDiscount}
          <p class="text-gray-400 line-through">{formatPrice(total)}</p>
          <div class="flex items-center justify-center gap-2">
            <p class="text-4xl font-bold text-pos-success">{formatPrice(finalTotal)}</p>
            <span class="px-2 py-1 bg-pos-warning/20 text-pos-warning rounded text-sm">
              {#if activeDiscount.type === 'offered'}
                OFFERT
              {:else if activeDiscount.type === 'percent'}
                -{activeDiscount.value}%
              {:else}
                -{formatPrice(activeDiscount.value)}
              {/if}
            </span>
            <button
              class="text-pos-danger hover:text-red-400 text-xl"
              onclick={removeDiscount}
              title="Supprimer la remise"
            >
              ×
            </button>
          </div>
        {:else}
          <p class="text-gray-400 text-lg">Total à payer</p>
          <p class="text-5xl font-bold text-pos-success">{formatPrice(finalTotal)}</p>
        {/if}
      </div>

      <!-- Vue principale -->
      {#if currentView === 'main'}
        <!-- Actions rapides -->
        <div class="grid grid-cols-4 gap-2 mb-4">
          <button
            class="action-btn bg-pos-info/20 text-pos-info"
            onclick={() => currentView = 'discount'}
          >
            <span class="text-xl">%</span>
            <span class="text-xs">Remise</span>
          </button>
          <button
            class="action-btn bg-pos-warning/20 text-pos-warning"
            onclick={offerTicket}
          >
            <span class="text-xl">🎁</span>
            <span class="text-xs">Offert</span>
          </button>
          <button
            class="action-btn bg-pos-accent text-pos-text"
            onclick={addPlasticBag}
          >
            <span class="text-xl">🛍️</span>
            <span class="text-xs">Sac 0,10€</span>
          </button>
          <button
            class="action-btn bg-pos-accent text-pos-text"
            onclick={openCashDrawer}
          >
            <span class="text-xl">🗃️</span>
            <span class="text-xs">Tiroir</span>
          </button>
        </div>

        <!-- Méthodes de paiement -->
        <p class="text-gray-400 text-sm mb-2">Mode de paiement</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button
            class="payment-btn"
            onclick={quickCardPayment}
          >
            <span class="text-4xl">💳</span>
            <span class="font-medium">Carte</span>
            <span class="text-xs text-gray-400">Paiement rapide</span>
          </button>
          <button
            class="payment-btn"
            onclick={() => { selectedMethod = 'cash'; currentView = 'cash'; }}
          >
            <span class="text-4xl">💵</span>
            <span class="font-medium">Espèces</span>
            <span class="text-xs text-gray-400">Avec rendu monnaie</span>
          </button>
          <button
            class="payment-btn"
            onclick={() => currentView = 'ticket_resto'}
          >
            <span class="text-4xl">🎫</span>
            <span class="font-medium">Ticket Resto</span>
            <span class="text-xs text-gray-400">Titre restaurant</span>
          </button>
          <button
            class="payment-btn"
            onclick={() => currentView = 'mixed'}
          >
            <span class="text-4xl">🔀</span>
            <span class="font-medium">Mixte</span>
            <span class="text-xs text-gray-400">Plusieurs moyens</span>
          </button>
        </div>

        <!-- Paiement partagé - NOUVEAU -->
        <div class="mb-4">
          <button
            class="w-full payment-btn-highlight"
            onclick={() => currentView = 'split'}
          >
            <span class="text-3xl">👥</span>
            <div class="text-left">
              <span class="font-bold text-lg">Addition partagée</span>
              <span class="text-sm text-gray-300 block">Plusieurs personnes paient leur part</span>
            </div>
            <span class="text-2xl">→</span>
          </button>
        </div>

        <!-- Autres options -->
        <div class="grid grid-cols-2 gap-3">
          <button
            class="payment-btn-small"
            onclick={() => { selectedMethod = 'cheque'; processPayment(); }}
          >
            <span class="text-2xl">📝</span>
            <span>Chèque</span>
          </button>
          <button
            class="payment-btn-small"
            onclick={() => currentView = 'note'}
          >
            <span class="text-2xl">📋</span>
            <span>Note de frais</span>
          </button>
        </div>

      <!-- Vue espèces -->
      {:else if currentView === 'cash'}
        <div class="bg-pos-dark rounded-xl p-4">
          <p class="text-gray-400 mb-3">Montant reçu</p>

          <!-- Input -->
          <div class="flex items-center gap-3 mb-4">
            <input
              type="number"
              bind:value={cashGiven}
              placeholder="0,00"
              class="flex-1 bg-pos-accent text-pos-text text-4xl font-bold p-4 rounded-xl text-center outline-none focus:ring-2 focus:ring-pos-primary"
              step="0.01"
              min="0"
            />
            <span class="text-3xl text-pos-text">€</span>
          </div>

          <!-- Boutons billets -->
          <p class="text-gray-400 text-sm mb-2">Billets</p>
          <div class="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            {#each billButtons as bill}
              <button
                class="bill-btn"
                onclick={() => addBill(bill.value)}
              >
                <span class="text-lg">{bill.image}</span>
                <span class="font-bold">{bill.label}</span>
              </button>
            {/each}
          </div>

          <!-- Actions rapides -->
          <div class="grid grid-cols-4 gap-2 mb-4">
            <button class="quick-btn" onclick={setExactAmount}>
              Exact
            </button>
            <button class="quick-btn" onclick={() => roundUp(5)}>
              Arrondi 5€
            </button>
            <button class="quick-btn" onclick={() => roundUp(10)}>
              Arrondi 10€
            </button>
            <button class="quick-btn bg-pos-danger/30 text-pos-danger" onclick={clearCash}>
              Effacer
            </button>
          </div>

          <!-- Rendu monnaie -->
          {#if cashAmount > 0}
            <div class="p-4 bg-pos-accent rounded-xl text-center">
              <p class="text-gray-400 text-sm">Rendu monnaie</p>
              <p class="text-4xl font-bold {change >= 0 ? 'text-pos-success' : 'text-pos-danger'}">
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

        <!-- Bouton validation espèces -->
        <button
          class="w-full mt-4 py-4 rounded-xl font-bold text-xl transition-all
                 {canPayCash && !isProcessing
                   ? 'bg-pos-success text-pos-dark hover:bg-green-400'
                   : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
          disabled={!canPayCash || isProcessing}
          onclick={processPayment}
        >
          {#if isProcessing}
            ⏳ Traitement...
          {:else}
            ✓ VALIDER ({formatPrice(finalTotal)})
          {/if}
        </button>

      <!-- Vue Ticket Resto -->
      {:else if currentView === 'ticket_resto'}
        <div class="bg-pos-dark rounded-xl p-4">
          <p class="text-gray-400 mb-3">Titres Restaurant</p>

          <!-- Valeur du ticket -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p class="block text-sm text-gray-400 mb-1">Valeur du ticket</p>
              <div class="flex gap-2">
                {#each [7, 8, 9, 10, 11, 13] as value}
                  <button
                    class="flex-1 py-2 rounded-lg font-bold transition-colors
                           {ticketRestoValue === value ? 'bg-pos-primary text-white' : 'bg-pos-accent text-pos-text'}"
                    onclick={() => ticketRestoValue = value}
                  >
                    {value}€
                  </button>
                {/each}
              </div>
            </div>
            <div>
              <p class="block text-sm text-gray-400 mb-1">Nombre de tickets</p>
              <div class="flex items-center gap-2">
                <button
                  class="w-12 h-12 bg-pos-accent rounded-lg text-2xl font-bold"
                  onclick={() => ticketRestoCount = Math.max(1, ticketRestoCount - 1)}
                >
                  -
                </button>
                <span class="flex-1 text-center text-3xl font-bold text-pos-text">{ticketRestoCount}</span>
                <button
                  class="w-12 h-12 bg-pos-accent rounded-lg text-2xl font-bold"
                  onclick={() => ticketRestoCount++}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <!-- Résumé -->
          <div class="bg-pos-accent rounded-xl p-4 space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-400">Total tickets</span>
              <span class="font-bold text-pos-text">{ticketRestoCount} × {ticketRestoValue}€ = {formatPrice(ticketRestoTotal)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">À payer</span>
              <span class="font-bold text-pos-text">{formatPrice(finalTotal)}</span>
            </div>
            {#if ticketRestoRemaining > 0}
              <div class="flex justify-between border-t border-pos-dark pt-2">
                <span class="text-pos-warning">Reste à payer (espèces/CB)</span>
                <span class="font-bold text-pos-warning">{formatPrice(ticketRestoRemaining)}</span>
              </div>
            {:else if ticketRestoRemaining < 0}
              <div class="flex justify-between border-t border-pos-dark pt-2">
                <span class="text-pos-info">Pas de rendu sur ticket resto</span>
                <span class="font-bold text-pos-info">-{formatPrice(Math.abs(ticketRestoRemaining))}</span>
              </div>
            {/if}
          </div>
        </div>

        <button
          class="w-full mt-4 py-4 rounded-xl font-bold text-xl transition-all bg-pos-success text-pos-dark hover:bg-green-400"
          disabled={isProcessing}
          onclick={processPayment}
        >
          {#if isProcessing}
            ⏳ Traitement...
          {:else}
            ✓ VALIDER TICKET RESTO
          {/if}
        </button>

      <!-- Vue Paiement Mixte -->
      {:else if currentView === 'mixed'}
        <div class="bg-pos-dark rounded-xl p-4">
          <p class="text-gray-400 mb-3">Paiement partagé (plusieurs moyens)</p>

          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <span class="w-24 text-gray-400">💵 Espèces</span>
              <input
                type="number"
                bind:value={mixedCash}
                placeholder="0,00"
                class="flex-1 bg-pos-accent text-pos-text text-xl font-bold p-3 rounded-lg text-right outline-none focus:ring-2 focus:ring-pos-primary"
                step="0.01"
                min="0"
              />
              <span class="text-pos-text">€</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-24 text-gray-400">💳 Carte</span>
              <input
                type="number"
                bind:value={mixedCard}
                placeholder="0,00"
                class="flex-1 bg-pos-accent text-pos-text text-xl font-bold p-3 rounded-lg text-right outline-none focus:ring-2 focus:ring-pos-primary"
                step="0.01"
                min="0"
              />
              <span class="text-pos-text">€</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-24 text-gray-400">🎫 Ticket R.</span>
              <input
                type="number"
                bind:value={mixedTicket}
                placeholder="0,00"
                class="flex-1 bg-pos-accent text-pos-text text-xl font-bold p-3 rounded-lg text-right outline-none focus:ring-2 focus:ring-pos-primary"
                step="0.01"
                min="0"
              />
              <span class="text-pos-text">€</span>
            </div>
          </div>

          <!-- Résumé -->
          <div class="bg-pos-accent rounded-xl p-4 mt-4 space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-400">Total saisi</span>
              <span class="font-bold text-pos-text">{formatPrice(mixedTotal)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">À payer</span>
              <span class="font-bold text-pos-text">{formatPrice(finalTotal)}</span>
            </div>
            <div class="flex justify-between border-t border-pos-dark pt-2">
              <span class="{Math.abs(mixedRemaining) < 0.01 ? 'text-pos-success' : 'text-pos-danger'}">
                {mixedRemaining > 0.01 ? 'Reste à saisir' : mixedRemaining < -0.01 ? 'Trop perçu' : 'Compte exact'}
              </span>
              <span class="font-bold {Math.abs(mixedRemaining) < 0.01 ? 'text-pos-success' : 'text-pos-danger'}">
                {formatPrice(Math.abs(mixedRemaining))}
              </span>
            </div>
          </div>
        </div>

        <button
          class="w-full mt-4 py-4 rounded-xl font-bold text-xl transition-all
                 {canPayMixed && !isProcessing
                   ? 'bg-pos-success text-pos-dark hover:bg-green-400'
                   : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
          disabled={!canPayMixed || isProcessing}
          onclick={processPayment}
        >
          {#if isProcessing}
            ⏳ Traitement...
          {:else}
            ✓ VALIDER PAIEMENT MIXTE
          {/if}
        </button>

      <!-- Vue Paiement Partagé Multi-Personnes - NOUVEAU -->
      {:else if currentView === 'split'}
        <div class="bg-pos-dark rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <p class="text-gray-400">👥 Addition partagée</p>
            <div class="flex gap-2">
              <button
                class="px-3 py-1.5 bg-pos-info/20 text-pos-info rounded-lg text-sm font-medium hover:bg-pos-info/30 transition-colors"
                onclick={splitEvenly}
              >
                ÷ Diviser également
              </button>
              <button
                class="px-3 py-1.5 bg-pos-primary/20 text-pos-primary rounded-lg text-sm font-medium hover:bg-pos-primary/30 transition-colors"
                onclick={addPayer}
              >
                + Ajouter
              </button>
            </div>
          </div>

          <!-- Liste des payeurs -->
          <div class="space-y-3 max-h-64 overflow-y-auto">
            {#each splitPayers as payer, index (payer.id)}
              <div class="split-payer-card {payer.paid ? 'paid' : ''}">
                <div class="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={payer.name}
                    oninput={(e) => updatePayerName(payer.id, (e.target as HTMLInputElement).value)}
                    class="flex-1 bg-transparent text-pos-text font-medium outline-none border-b border-transparent focus:border-pos-primary"
                    placeholder="Nom"
                  />
                  {#if splitPayers.length > 2}
                    <button
                      class="w-6 h-6 text-pos-danger hover:bg-pos-danger/20 rounded transition-colors text-sm"
                      onclick={() => removePayer(payer.id)}
                    >
                      ✕
                    </button>
                  {/if}
                </div>

                <div class="flex items-center gap-2">
                  <!-- Montant -->
                  <div class="flex-1 flex items-center gap-1">
                    <input
                      type="number"
                      value={payer.amount}
                      oninput={(e) => updatePayerAmount(payer.id, (e.target as HTMLInputElement).value)}
                      placeholder="0,00"
                      class="w-full bg-pos-accent text-pos-text text-lg font-bold p-2 rounded-lg text-right outline-none focus:ring-2 focus:ring-pos-primary"
                      step="0.01"
                      min="0"
                      disabled={payer.paid}
                    />
                    <span class="text-gray-400">€</span>
                  </div>

                  <!-- Méthode de paiement -->
                  <div class="flex gap-1">
                    <button
                      class="split-method-btn {payer.method === 'card' ? 'active' : ''}"
                      onclick={() => updatePayerMethod(payer.id, 'card')}
                      disabled={payer.paid}
                      title="Carte"
                    >
                      💳
                    </button>
                    <button
                      class="split-method-btn {payer.method === 'cash' ? 'active' : ''}"
                      onclick={() => updatePayerMethod(payer.id, 'cash')}
                      disabled={payer.paid}
                      title="Espèces"
                    >
                      💵
                    </button>
                    <button
                      class="split-method-btn {payer.method === 'ticket_resto' ? 'active' : ''}"
                      onclick={() => updatePayerMethod(payer.id, 'ticket_resto')}
                      disabled={payer.paid}
                      title="Ticket Resto"
                    >
                      🎫
                    </button>
                  </div>

                  <!-- Bouton payé -->
                  {#if payer.paid}
                    <button
                      class="split-paid-btn paid"
                      onclick={() => markPayerUnpaid(payer.id)}
                    >
                      ✓ Payé
                    </button>
                  {:else}
                    <button
                      class="split-paid-btn"
                      onclick={() => markPayerPaid(payer.id)}
                      disabled={!payer.amount || parseFloat(payer.amount) <= 0}
                    >
                      Encaisser
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>

          <!-- Résumé -->
          <div class="bg-pos-accent rounded-xl p-4 mt-4 space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-400">Total à payer</span>
              <span class="font-bold text-pos-text">{formatPrice(finalTotal)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Total saisi ({splitPayers.length} pers.)</span>
              <span class="font-bold text-pos-text">{formatPrice(splitTotal)}</span>
            </div>
            <div class="flex justify-between border-t border-pos-dark pt-2">
              <span class="{Math.abs(splitRemaining) < 0.01 ? 'text-pos-success' : 'text-pos-warning'}">
                {splitRemaining > 0.01 ? 'Reste à répartir' : splitRemaining < -0.01 ? 'Trop réparti' : 'Total exact'}
              </span>
              <span class="font-bold {Math.abs(splitRemaining) < 0.01 ? 'text-pos-success' : 'text-pos-warning'}">
                {formatPrice(Math.abs(splitRemaining))}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Payé</span>
              <span class="font-bold text-pos-success">
                {formatPrice(splitPayers.filter(p => p.paid).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0))}
              </span>
            </div>
          </div>
        </div>

        <button
          class="w-full mt-4 py-4 rounded-xl font-bold text-xl transition-all
                 {splitAllPaid && !isProcessing
                   ? 'bg-pos-success text-pos-dark hover:bg-green-400'
                   : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
          disabled={!splitAllPaid || isProcessing}
          onclick={processPayment}
        >
          {#if isProcessing}
            ⏳ Traitement...
          {:else if !canPaySplit}
            Répartir le total exact
          {:else if !splitAllPaid}
            Encaisser toutes les parts
          {:else}
            ✓ FINALISER L'ADDITION
          {/if}
        </button>

      <!-- Vue Remise -->
      {:else if currentView === 'discount'}
        <div class="bg-pos-dark rounded-xl p-4">
          <p class="text-gray-400 mb-3">Appliquer une remise</p>

          <!-- Type de remise -->
          <div class="grid grid-cols-3 gap-2 mb-4">
            <button
              class="py-3 rounded-lg font-bold transition-colors
                     {discountType === 'percent' ? 'bg-pos-primary text-white' : 'bg-pos-accent text-pos-text'}"
              onclick={() => discountType = 'percent'}
            >
              % Pourcentage
            </button>
            <button
              class="py-3 rounded-lg font-bold transition-colors
                     {discountType === 'amount' ? 'bg-pos-primary text-white' : 'bg-pos-accent text-pos-text'}"
              onclick={() => discountType = 'amount'}
            >
              € Montant
            </button>
            <button
              class="py-3 rounded-lg font-bold transition-colors
                     {discountType === 'offered' ? 'bg-pos-primary text-white' : 'bg-pos-accent text-pos-text'}"
              onclick={() => discountType = 'offered'}
            >
              🎁 Offert
            </button>
          </div>

          {#if discountType !== 'offered'}
            <div class="flex items-center gap-3 mb-4">
              <input
                type="number"
                bind:value={discountValue}
                placeholder={discountType === 'percent' ? '10' : '5,00'}
                class="flex-1 bg-pos-accent text-pos-text text-3xl font-bold p-4 rounded-xl text-center outline-none focus:ring-2 focus:ring-pos-primary"
                step={discountType === 'percent' ? '1' : '0.01'}
                min="0"
                max={discountType === 'percent' ? '100' : undefined}
              />
              <span class="text-3xl text-pos-text">{discountType === 'percent' ? '%' : '€'}</span>
            </div>

            <!-- Boutons rapides -->
            {#if discountType === 'percent'}
              <div class="grid grid-cols-4 gap-2 mb-4">
                {#each [5, 10, 15, 20] as pct}
                  <button
                    class="quick-btn"
                    onclick={() => discountValue = pct.toString()}
                  >
                    {pct}%
                  </button>
                {/each}
              </div>
            {/if}
          {/if}

          <!-- Raison -->
          <div class="mb-4">
            <p class="block text-sm text-gray-400 mb-1">Raison (optionnel)</p>
            <input
              type="text"
              bind:value={discountReason}
              placeholder="Client fidèle, erreur de commande..."
              class="w-full bg-pos-accent text-pos-text p-3 rounded-lg outline-none focus:ring-2 focus:ring-pos-primary"
            />
          </div>

          <!-- Aperçu -->
          {#if discountValue || discountType === 'offered'}
            <div class="bg-pos-accent rounded-xl p-4 text-center">
              <p class="text-gray-400 text-sm">Nouveau total</p>
              <p class="text-3xl font-bold text-pos-success">
                {formatPrice(calculateFinalTotal(total, {
                  type: discountType,
                  value: discountType === 'offered' ? 100 : parseFloat(discountValue) || 0
                }))}
              </p>
            </div>
          {/if}
        </div>

        <button
          class="w-full mt-4 py-4 rounded-xl font-bold text-xl bg-pos-primary text-white hover:bg-pos-primary/80 transition-colors"
          onclick={applyDiscount}
        >
          ✓ APPLIQUER LA REMISE
        </button>

      <!-- Vue Note de frais -->
      {:else if currentView === 'note'}
        <div class="bg-pos-dark rounded-xl p-4">
          <p class="text-gray-400 mb-3">Note de frais / Commentaire</p>

          <textarea
            bind:value={transactionNote}
            placeholder="Nom du client, numéro de bon, référence..."
            rows="4"
            class="w-full bg-pos-accent text-pos-text p-4 rounded-lg outline-none focus:ring-2 focus:ring-pos-primary resize-none"
          ></textarea>

          <div class="mt-4 grid grid-cols-2 gap-2">
            <button
              class="py-2 bg-pos-accent rounded-lg text-sm"
              onclick={() => transactionNote = 'Note de frais - '}
            >
              📋 Note de frais
            </button>
            <button
              class="py-2 bg-pos-accent rounded-lg text-sm"
              onclick={() => transactionNote = 'Repas affaires - '}
            >
              🍽️ Repas affaires
            </button>
          </div>
        </div>

        <button
          class="w-full mt-4 py-4 rounded-xl font-bold text-xl bg-pos-primary text-white hover:bg-pos-primary/80 transition-colors"
          onclick={() => currentView = 'main'}
        >
          ✓ ENREGISTRER ET CONTINUER
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .payment-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 1rem;
    background: var(--pos-accent);
    border-radius: 1rem;
    transition: all 0.15s ease;
    color: var(--pos-text);
    gap: 0.25rem;
  }

  .payment-btn:hover {
    background: var(--pos-primary);
    transform: scale(1.02);
  }

  .payment-btn-highlight {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(78, 205, 196, 0.15) 100%);
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: 1rem;
    transition: all 0.15s ease;
    color: var(--pos-text);
    gap: 1rem;
  }

  .payment-btn-highlight:hover {
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.25) 0%, rgba(78, 205, 196, 0.25) 100%);
    border-color: rgba(255, 107, 107, 0.5);
    transform: scale(1.01);
  }

  .payment-btn-small {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--pos-accent);
    border-radius: 0.75rem;
    transition: all 0.15s ease;
    color: var(--pos-text);
  }

  .payment-btn-small:hover {
    background: var(--pos-dark);
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    border-radius: 0.75rem;
    transition: all 0.15s ease;
    gap: 0.25rem;
  }

  .action-btn:hover {
    opacity: 0.8;
    transform: scale(1.02);
  }

  .bill-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 0.5rem;
    background: linear-gradient(135deg, #85bb65 0%, #3d6b2f 100%);
    border-radius: 0.5rem;
    color: white;
    transition: all 0.1s ease;
    gap: 0.25rem;
  }

  .bill-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(133, 187, 101, 0.3);
  }

  .bill-btn:active {
    transform: scale(0.95);
  }

  .quick-btn {
    padding: 0.75rem;
    background: var(--pos-accent);
    color: var(--pos-text);
    font-weight: 600;
    border-radius: 0.5rem;
    transition: all 0.1s ease;
  }

  .quick-btn:hover {
    background: var(--pos-primary);
  }

  .quick-btn:active {
    transform: scale(0.95);
  }

  /* Split Payment Styles */
  .split-payer-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 0.75rem;
    transition: all 0.2s ease;
  }

  .split-payer-card.paid {
    background: rgba(46, 204, 113, 0.1);
    border-color: rgba(46, 204, 113, 0.3);
  }

  .split-method-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.15s ease;
  }

  .split-method-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  .split-method-btn.active {
    background: var(--pos-primary);
    border-color: var(--pos-primary);
  }

  .split-method-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .split-paid-btn {
    padding: 0.5rem 0.75rem;
    background: var(--pos-accent);
    color: var(--pos-text);
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: 8px;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .split-paid-btn:hover:not(:disabled) {
    background: var(--pos-success);
    color: var(--pos-dark);
  }

  .split-paid-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .split-paid-btn.paid {
    background: var(--pos-success);
    color: var(--pos-dark);
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
