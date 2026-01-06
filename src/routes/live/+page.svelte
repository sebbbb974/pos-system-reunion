<script lang="ts">
  import { transactionsStore } from '$lib/stores/transactions';
  import { currentPermissions, authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';

  // Vérifier les permissions
  $: if ($currentPermissions && !$currentPermissions.canViewRemotely) {
    goto('/');
  }

  let currentTime = new Date();
  let refreshInterval: number;
  let isFullscreen = false;

  onMount(() => {
    // Mettre à jour l'heure toutes les secondes
    refreshInterval = setInterval(() => {
      currentTime = new Date();
    }, 1000);

    // Détecter si on est sur mobile pour activer le mode plein écran par défaut
    if (window.innerWidth < 768) {
      isFullscreen = true;
    }
  });

  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function formatTimeShort(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function formatDateShort(date: Date): string {
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' €';
  }

  function formatPriceCompact(price: number): string {
    if (price >= 1000) {
      return (price / 1000).toFixed(1).replace('.', ',') + 'k €';
    }
    return price.toFixed(0) + ' €';
  }

  function formatHour(timestamp: Date | string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function getPaymentIcon(method: string): string {
    switch (method) {
      case 'card': return '💳';
      case 'cash': return '💵';
      case 'ticket_resto': return '🎫';
      case 'mixed': return '🔄';
      case 'cheque': return '📝';
      default: return '💰';
    }
  }

  function getPaymentLabel(method: string): string {
    switch (method) {
      case 'card': return 'CB';
      case 'cash': return 'Espèces';
      case 'ticket_resto': return 'Ticket R.';
      case 'mixed': return 'Mixte';
      case 'cheque': return 'Chèque';
      default: return method;
    }
  }

  // Récupérer les dernières transactions (live)
  $: todayTransactions = $transactionsStore
    .filter(t => new Date(t.timestamp).toDateString() === new Date().toDateString())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  $: last10Transactions = todayTransactions.slice(0, 10);
  $: last5Transactions = todayTransactions.slice(0, 5);

  // Stats calculées
  $: totalToday = todayTransactions.reduce((sum, t) => sum + (t.finalTotal || t.total), 0);
  $: transactionCount = todayTransactions.length;
  $: averageTicket = transactionCount > 0 ? totalToday / transactionCount : 0;

  // Calcul par méthode de paiement
  $: cardPayments = todayTransactions.filter(t => t.paymentMethod === 'card');
  $: cashPayments = todayTransactions.filter(t => t.paymentMethod === 'cash');
  $: ticketRestoPayments = todayTransactions.filter(t => t.paymentMethod === 'ticket_resto');
  $: mixedPayments = todayTransactions.filter(t => t.paymentMethod === 'mixed');

  $: cardTotal = cardPayments.reduce((sum, t) => sum + (t.finalTotal || t.total), 0);
  $: cashTotal = cashPayments.reduce((sum, t) => sum + (t.finalTotal || t.total), 0);
  $: ticketRestoTotal = ticketRestoPayments.reduce((sum, t) => sum + (t.finalTotal || t.total), 0);
  $: mixedTotal = mixedPayments.reduce((sum, t) => sum + (t.finalTotal || t.total), 0);

  // Transactions offertes
  $: offeredTransactions = todayTransactions.filter(t => t.isOffered || t.discount?.type === 'offered');
  $: offeredTotal = offeredTransactions.reduce((sum, t) => sum + t.total, 0);

  // Heure actuelle pour afficher l'activité
  $: currentHour = currentTime.getHours();
  $: currentHourTransactions = todayTransactions.filter(t => {
    const hour = new Date(t.timestamp).getHours();
    return hour === currentHour;
  });
  $: currentHourRevenue = currentHourTransactions.reduce((sum, t) => sum + (t.finalTotal || t.total), 0);

  // Status de l'activité
  $: activityStatus = (() => {
    if (currentHourTransactions.length === 0) return 'calme';
    if (currentHourTransactions.length < 5) return 'modéré';
    if (currentHourTransactions.length < 15) return 'actif';
    return 'très actif';
  })();

  $: activityColor = (() => {
    if (activityStatus === 'calme') return '#6b7280';
    if (activityStatus === 'modéré') return '#fbbf24';
    if (activityStatus === 'actif') return '#4ade80';
    return '#ef4444';
  })();

  // Toggle fullscreen mode
  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
  }
</script>

<svelte:head>
  <title>Live - POS System</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</svelte:head>

<div class="h-full overflow-y-auto bg-pos-dark" class:fullscreen-mode={isFullscreen}>
  <!-- Header compact pour mobile -->
  <div class="sticky top-0 z-20 bg-pos-darker/95 backdrop-blur-sm border-b border-pos-accent">
    <div class="flex items-center justify-between p-3 md:p-4">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 md:w-3 md:h-3 rounded-full animate-pulse" style="background-color: {activityColor}"></div>
        <span class="text-lg md:text-2xl font-bold text-pos-text">{formatTimeShort(currentTime)}</span>
        <span class="hidden sm:inline text-sm text-gray-400 capitalize">{formatDateShort(currentTime)}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs md:text-sm px-2 py-1 rounded-full" style="background-color: {activityColor}20; color: {activityColor}">
          {activityStatus}
        </span>
        <button
          on:click={toggleFullscreen}
          class="p-2 rounded-lg bg-pos-accent/30 hover:bg-pos-accent/50 transition-colors"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? '↙️' : '↗️'}
        </button>
      </div>
    </div>
  </div>

  <div class="p-3 md:p-6 max-w-6xl mx-auto">
    <!-- Chiffre d'affaires principal - GRAND et visible -->
    <div class="bg-gradient-to-br from-pos-success/20 to-pos-success/5 rounded-2xl p-4 md:p-6 mb-4 border border-pos-success/30">
      <p class="text-sm md:text-base text-pos-success/80 mb-1">CA du jour</p>
      <p class="text-4xl md:text-6xl font-black text-pos-success tracking-tight">
        {formatPrice(totalToday)}
      </p>
      <div class="flex items-center gap-4 mt-3 text-sm text-gray-400">
        <span>{transactionCount} vente{transactionCount > 1 ? 's' : ''}</span>
        <span>•</span>
        <span>Moy. {formatPrice(averageTicket)}</span>
      </div>
    </div>

    <!-- Stats rapides - grille 2x2 mobile, 4 colonnes desktop -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
      <div class="bg-pos-darker rounded-xl p-3 md:p-4 border border-pos-accent">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">💳</span>
          <span class="text-xs text-gray-400">CB</span>
        </div>
        <p class="text-xl md:text-2xl font-bold text-pos-info">{formatPriceCompact(cardTotal)}</p>
        <p class="text-xs text-gray-500">{cardPayments.length} paiement{cardPayments.length > 1 ? 's' : ''}</p>
      </div>

      <div class="bg-pos-darker rounded-xl p-3 md:p-4 border border-pos-accent">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">💵</span>
          <span class="text-xs text-gray-400">Espèces</span>
        </div>
        <p class="text-xl md:text-2xl font-bold text-pos-success">{formatPriceCompact(cashTotal)}</p>
        <p class="text-xs text-gray-500">{cashPayments.length} paiement{cashPayments.length > 1 ? 's' : ''}</p>
      </div>

      <div class="bg-pos-darker rounded-xl p-3 md:p-4 border border-pos-accent">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">🎫</span>
          <span class="text-xs text-gray-400">Ticket R.</span>
        </div>
        <p class="text-xl md:text-2xl font-bold text-pos-warning">{formatPriceCompact(ticketRestoTotal)}</p>
        <p class="text-xs text-gray-500">{ticketRestoPayments.length} paiement{ticketRestoPayments.length > 1 ? 's' : ''}</p>
      </div>

      <div class="bg-pos-darker rounded-xl p-3 md:p-4 border border-pos-accent">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">⏰</span>
          <span class="text-xs text-gray-400">Cette heure</span>
        </div>
        <p class="text-xl md:text-2xl font-bold text-pos-primary">{formatPriceCompact(currentHourRevenue)}</p>
        <p class="text-xs text-gray-500">{currentHourTransactions.length} vente{currentHourTransactions.length > 1 ? 's' : ''}</p>
      </div>
    </div>

    <!-- Graphique horaire - optimisé mobile -->
    <div class="bg-pos-darker rounded-xl p-3 md:p-4 border border-pos-accent mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-pos-text text-sm md:text-base">Activité</h3>
        <span class="text-xs text-gray-400">{currentHour}h en cours</span>
      </div>
      <div class="flex items-end gap-0.5 md:gap-1 h-20 md:h-32">
        {#each Array(17) as _, i}
          {@const hour = i + 6}
          {@const hourTx = todayTransactions.filter(t => new Date(t.timestamp).getHours() === hour)}
          {@const hourRevenue = hourTx.reduce((sum, t) => sum + (t.finalTotal || t.total), 0)}
          {@const maxRevenue = Math.max(...Array(17).fill(0).map((_, j) =>
            todayTransactions.filter(t => new Date(t.timestamp).getHours() === j + 6).reduce((sum, t) => sum + (t.finalTotal || t.total), 0)
          ), 100)}
          {@const heightPercent = maxRevenue > 0 ? (hourRevenue / maxRevenue) * 100 : 0}
          {@const isCurrentHour = hour === currentHour}
          {@const isPastHour = hour < currentHour}
          <div class="flex-1 flex flex-col items-center">
            <div
              class="w-full rounded-t transition-all duration-300"
              class:animate-pulse={isCurrentHour}
              style="height: {Math.max(heightPercent, 2)}%; background-color: {isCurrentHour ? '#e94560' : isPastHour ? '#0f3460' : '#1a1a2e'}"
            ></div>
            {#if hour % 3 === 0 || isCurrentHour}
              <span class="text-[10px] md:text-xs text-gray-500 mt-1" class:text-pos-primary={isCurrentHour} class:font-bold={isCurrentHour}>
                {hour}h
              </span>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Dernières transactions - version compacte mobile -->
    <div class="bg-pos-darker rounded-xl border border-pos-accent overflow-hidden">
      <div class="p-3 md:p-4 border-b border-pos-accent flex items-center justify-between">
        <h3 class="font-bold text-pos-text text-sm md:text-base">Dernières ventes</h3>
        <div class="flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-pos-primary animate-pulse"></span>
          <span class="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {#if last5Transactions.length === 0}
        <div class="p-6 md:p-8 text-center text-gray-400">
          <span class="text-3xl md:text-4xl block mb-2">📊</span>
          <p class="text-sm">Aucune transaction aujourd'hui</p>
        </div>
      {:else}
        <div class="divide-y divide-pos-accent/30">
          {#each last5Transactions as transaction, index}
            <div class="p-3 md:p-4 flex items-center justify-between hover:bg-pos-accent/10 transition-colors">
              <div class="flex items-center gap-2 md:gap-3 min-w-0">
                <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-pos-accent/50 flex items-center justify-center flex-shrink-0">
                  <span class="text-base md:text-lg">{getPaymentIcon(transaction.paymentMethod)}</span>
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-pos-text text-sm md:text-base truncate">
                    {formatHour(transaction.timestamp)}
                    {#if index === 0}
                      <span class="ml-1 text-xs px-1.5 py-0.5 rounded bg-pos-primary/30 text-pos-primary">NEW</span>
                    {/if}
                  </p>
                  <p class="text-xs text-gray-400 truncate">
                    {transaction.items.length} art. • {getPaymentLabel(transaction.paymentMethod)}
                    {#if transaction.isOffered || transaction.discount?.type === 'offered'}
                      <span class="ml-1 text-pos-warning">🎁</span>
                    {/if}
                  </p>
                </div>
              </div>
              <div class="text-right flex-shrink-0 ml-2">
                <p class="font-bold text-pos-success text-sm md:text-base">
                  {#if transaction.isOffered || transaction.discount?.type === 'offered'}
                    <span class="line-through text-gray-500 text-xs mr-1">{formatPrice(transaction.total)}</span>
                    0,00 €
                  {:else}
                    {formatPrice(transaction.finalTotal || transaction.total)}
                  {/if}
                </p>
              </div>
            </div>
          {/each}
        </div>

        <!-- Voir plus (desktop) -->
        <div class="hidden md:block p-3 border-t border-pos-accent/30">
          <details class="group">
            <summary class="cursor-pointer text-sm text-pos-primary hover:underline">
              Voir {Math.min(5, last10Transactions.length - 5)} autres transactions
            </summary>
            <div class="mt-2 divide-y divide-pos-accent/30">
              {#each last10Transactions.slice(5) as transaction}
                <div class="py-2 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span>{getPaymentIcon(transaction.paymentMethod)}</span>
                    <span class="text-sm text-gray-400">{formatHour(transaction.timestamp)}</span>
                  </div>
                  <span class="font-medium text-pos-success">{formatPrice(transaction.finalTotal || transaction.total)}</span>
                </div>
              {/each}
            </div>
          </details>
        </div>
      {/if}
    </div>

    <!-- Stats supplémentaires si des offerts/remises -->
    {#if offeredTransactions.length > 0}
      <div class="mt-4 p-3 md:p-4 bg-pos-warning/10 rounded-xl border border-pos-warning/30">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">🎁</span>
            <div>
              <p class="font-medium text-pos-warning text-sm">Offerts aujourd'hui</p>
              <p class="text-xs text-gray-400">{offeredTransactions.length} transaction{offeredTransactions.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <p class="text-lg font-bold text-pos-warning">{formatPrice(offeredTotal)}</p>
        </div>
      </div>
    {/if}

    <!-- Info mobile - plus compact -->
    <div class="mt-4 p-3 bg-pos-accent/20 rounded-xl text-center">
      <p class="text-xs text-gray-400">
        📱 Mise à jour automatique • Connecté: <span class="text-pos-primary">{$authStore?.name}</span>
      </p>
    </div>
  </div>
</div>

<style>
  .fullscreen-mode {
    position: fixed;
    inset: 0;
    z-index: 100;
  }

  /* Animation pour nouvelle transaction */
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .divide-y > div:first-child {
    animation: slideIn 0.3s ease-out;
  }

  /* Optimisations tactiles */
  @media (max-width: 768px) {
    button, summary {
      min-height: 44px;
      min-width: 44px;
    }
  }

  /* Safe area pour iPhone */
  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .fullscreen-mode {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
</style>
