<script lang="ts">
  import { transactionsStore, todayStats } from '$lib/stores/transactions';
  import { currentPermissions, authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';

  // Vérifier les permissions
  $: if ($currentPermissions && !$currentPermissions.canViewRemotely) {
    goto('/');
  }

  let currentTime = new Date();
  let refreshInterval: number;

  onMount(() => {
    // Mettre à jour l'heure toutes les secondes
    refreshInterval = setInterval(() => {
      currentTime = new Date();
    }, 1000);
  });

  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' €';
  }

  function formatHour(timestamp: Date | string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  // Récupérer les dernières transactions (live)
  $: todayTransactions = $transactionsStore
    .filter(t => new Date(t.timestamp).toDateString() === new Date().toDateString())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  $: last10Transactions = todayTransactions.slice(0, 10);

  // Stats calculées
  $: totalToday = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  $: transactionCount = todayTransactions.length;
  $: averageTicket = transactionCount > 0 ? totalToday / transactionCount : 0;

  // Calcul par méthode de paiement
  $: cardPayments = todayTransactions.filter(t => t.paymentMethod === 'card');
  $: cashPayments = todayTransactions.filter(t => t.paymentMethod === 'cash');
  $: cardTotal = cardPayments.reduce((sum, t) => sum + t.total, 0);
  $: cashTotal = cashPayments.reduce((sum, t) => sum + t.total, 0);

  // Heure actuelle pour afficher l'activité
  $: currentHour = currentTime.getHours();
  $: currentHourTransactions = todayTransactions.filter(t => {
    const hour = new Date(t.timestamp).getHours();
    return hour === currentHour;
  });
  $: currentHourRevenue = currentHourTransactions.reduce((sum, t) => sum + t.total, 0);

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
</script>

<svelte:head>
  <title>Suivi en Direct - POS System</title>
</svelte:head>

<div class="h-full overflow-y-auto p-4 md:p-6">
  <div class="max-w-6xl mx-auto">
    <!-- En-tête avec heure en temps réel -->
    <div class="bg-pos-darker rounded-2xl p-6 mb-6 border border-pos-accent">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-3 h-3 rounded-full animate-pulse" style="background-color: {activityColor}"></div>
            <span class="text-sm font-medium" style="color: {activityColor}">
              {activityStatus.charAt(0).toUpperCase() + activityStatus.slice(1)}
            </span>
          </div>
          <h1 class="text-3xl md:text-4xl font-bold text-pos-text">
            {formatTime(currentTime)}
          </h1>
          <p class="text-gray-400 capitalize">{formatDate(currentTime)}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-400">Connecté en tant que</p>
          <p class="text-lg font-bold text-pos-text">{$authStore?.name}</p>
          <p class="text-sm text-pos-primary">{$currentPermissions?.label}</p>
        </div>
      </div>
    </div>

    <!-- Stats principales -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-pos-darker rounded-xl p-4 border border-pos-accent">
        <p class="text-sm text-gray-400 mb-1">CA du jour</p>
        <p class="text-2xl md:text-3xl font-bold text-pos-success">{formatPrice(totalToday)}</p>
      </div>
      <div class="bg-pos-darker rounded-xl p-4 border border-pos-accent">
        <p class="text-sm text-gray-400 mb-1">Transactions</p>
        <p class="text-2xl md:text-3xl font-bold text-pos-info">{transactionCount}</p>
      </div>
      <div class="bg-pos-darker rounded-xl p-4 border border-pos-accent">
        <p class="text-sm text-gray-400 mb-1">Ticket moyen</p>
        <p class="text-2xl md:text-3xl font-bold text-pos-warning">{formatPrice(averageTicket)}</p>
      </div>
      <div class="bg-pos-darker rounded-xl p-4 border border-pos-accent">
        <p class="text-sm text-gray-400 mb-1">Cette heure</p>
        <p class="text-2xl md:text-3xl font-bold text-pos-primary">{formatPrice(currentHourRevenue)}</p>
      </div>
    </div>

    <!-- Paiements -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-pos-darker rounded-xl p-4 border border-pos-accent">
        <div class="flex items-center justify-between mb-3">
          <span class="text-gray-400">Paiements CB</span>
          <span class="text-2xl">💳</span>
        </div>
        <p class="text-2xl font-bold text-pos-info">{formatPrice(cardTotal)}</p>
        <p class="text-sm text-gray-500">{cardPayments.length} transactions</p>
      </div>
      <div class="bg-pos-darker rounded-xl p-4 border border-pos-accent">
        <div class="flex items-center justify-between mb-3">
          <span class="text-gray-400">Paiements Espèces</span>
          <span class="text-2xl">💵</span>
        </div>
        <p class="text-2xl font-bold text-pos-success">{formatPrice(cashTotal)}</p>
        <p class="text-sm text-gray-500">{cashPayments.length} transactions</p>
      </div>
    </div>

    <!-- Graphique horaire simplifié -->
    <div class="bg-pos-darker rounded-xl p-4 border border-pos-accent mb-6">
      <h3 class="font-bold text-pos-text mb-4">Activité par heure</h3>
      <div class="flex items-end gap-1 h-32">
        {#each Array(17) as _, i}
          {@const hour = i + 6}
          {@const hourTx = todayTransactions.filter(t => new Date(t.timestamp).getHours() === hour)}
          {@const hourRevenue = hourTx.reduce((sum, t) => sum + t.total, 0)}
          {@const maxRevenue = Math.max(...Array(17).fill(0).map((_, j) =>
            todayTransactions.filter(t => new Date(t.timestamp).getHours() === j + 6).reduce((sum, t) => sum + t.total, 0)
          ), 100)}
          {@const heightPercent = maxRevenue > 0 ? (hourRevenue / maxRevenue) * 100 : 0}
          {@const isCurrentHour = hour === currentHour}
          <div class="flex-1 flex flex-col items-center">
            <div
              class="w-full rounded-t transition-all"
              style="height: {Math.max(heightPercent, 4)}%; background-color: {isCurrentHour ? '#e94560' : '#0f3460'}"
            ></div>
            <span class="text-xs text-gray-500 mt-1">{hour}h</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Dernières transactions -->
    <div class="bg-pos-darker rounded-xl border border-pos-accent overflow-hidden">
      <div class="p-4 border-b border-pos-accent flex items-center justify-between">
        <h3 class="font-bold text-pos-text">Dernières transactions</h3>
        <span class="text-sm text-gray-400">En temps réel</span>
      </div>

      {#if last10Transactions.length === 0}
        <div class="p-8 text-center text-gray-400">
          <span class="text-4xl block mb-2">📊</span>
          Aucune transaction aujourd'hui
        </div>
      {:else}
        <div class="divide-y divide-pos-accent/50">
          {#each last10Transactions as transaction, index}
            <div class="p-4 flex items-center justify-between hover:bg-pos-accent/20 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-pos-accent flex items-center justify-center">
                  {transaction.paymentMethod === 'card' ? '💳' : '💵'}
                </div>
                <div>
                  <p class="font-medium text-pos-text">
                    {transaction.receiptNumber}
                  </p>
                  <p class="text-sm text-gray-400">
                    {formatHour(transaction.timestamp)} • {transaction.items.length} article{transaction.items.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold text-pos-success">{formatPrice(transaction.total)}</p>
                {#if index === 0}
                  <span class="text-xs px-2 py-0.5 rounded bg-pos-primary/20 text-pos-primary">Dernière</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Message d'information -->
    <div class="mt-6 p-4 bg-pos-info/10 rounded-xl border border-pos-info/30">
      <div class="flex items-start gap-3">
        <span class="text-2xl">📱</span>
        <div>
          <p class="font-medium text-pos-info">Suivi à distance</p>
          <p class="text-sm text-gray-400 mt-1">
            Cette page se met à jour automatiquement. Vous pouvez l'utiliser depuis votre téléphone ou ordinateur
            pour suivre l'activité de votre commerce en temps réel.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
