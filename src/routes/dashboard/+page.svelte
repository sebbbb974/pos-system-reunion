<script lang="ts">
  import { onMount } from 'svelte';
  import { todayStats, transactionsStore, analyzeTraffic, generateDemoTransactions } from '$lib/stores/transactions';
  import { productsStore } from '$lib/stores/products';
  import type { TrafficAnalysis, DashboardStats } from '$lib/types';

  let trafficAnalysis: TrafficAnalysis | null = null;
  let selectedPeriod: 7 | 14 | 30 = 7;

  function formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' €';
  }

  function formatHour(hour: number): string {
    return `${hour}h`;
  }

  function getTrafficColor(level: 'low' | 'medium' | 'high'): string {
    const colors = {
      low: '#4ade80',
      medium: '#fbbf24',
      high: '#ef4444'
    };
    return colors[level];
  }

  function getTrafficLabel(level: 'low' | 'medium' | 'high'): string {
    const labels = {
      low: 'Calme',
      medium: 'Modéré',
      high: 'Forte affluence'
    };
    return labels[level];
  }

  function updateAnalysis() {
    trafficAnalysis = analyzeTraffic(selectedPeriod);
  }

  function loadDemoData() {
    const products = $productsStore;
    if (products.length > 0) {
      const demoTransactions = generateDemoTransactions();
      transactionsStore.importDemo(demoTransactions);
      updateAnalysis();
    }
  }

  function clearData() {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les données ?')) {
      transactionsStore.clear();
      updateAnalysis();
    }
  }

  onMount(() => {
    updateAnalysis();
  });

  $: stats = $todayStats;
  $: if (selectedPeriod) updateAnalysis();

  // Calcul du max pour le graphique
  $: maxHourlyRevenue = Math.max(...(stats.hourlyData?.map(h => h.revenue) || [1]));
  $: maxHourlyCustomers = Math.max(...(trafficAnalysis?.peakHours?.map(h => h.averageCustomers) || [1]));
</script>

<svelte:head>
  <title>Dashboard - POS System</title>
</svelte:head>

<div class="h-full overflow-y-auto p-6">
  <div class="max-w-7xl mx-auto">
    <!-- En-tête -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-pos-text">Dashboard</h1>
        <p class="text-gray-400">Vue d'ensemble de votre activité</p>
      </div>
      <div class="flex gap-3">
        <button
          class="px-4 py-2 bg-pos-accent text-pos-text rounded-lg hover:bg-pos-primary transition-colors"
          on:click={loadDemoData}
        >
          📊 Charger données démo
        </button>
        <button
          class="px-4 py-2 bg-pos-danger/20 text-pos-danger rounded-lg hover:bg-pos-danger/30 transition-colors"
          on:click={clearData}
        >
          🗑️ Effacer
        </button>
      </div>
    </div>

    <!-- Cartes statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Chiffre du jour -->
      <div class="stat-card">
        <div class="flex items-center gap-3">
          <div class="stat-icon bg-pos-success/20 text-pos-success">💰</div>
          <div>
            <p class="text-sm text-gray-400">Chiffre du jour</p>
            <p class="text-2xl font-bold text-pos-text">{formatPrice(stats.todayRevenue)}</p>
            {#if stats.comparisonYesterday !== 0}
              <p class="text-xs {stats.comparisonYesterday >= 0 ? 'text-pos-success' : 'text-pos-danger'}">
                {stats.comparisonYesterday >= 0 ? '↑' : '↓'} {Math.abs(stats.comparisonYesterday).toFixed(1)}% vs hier
              </p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Nombre de transactions -->
      <div class="stat-card">
        <div class="flex items-center gap-3">
          <div class="stat-icon bg-pos-info/20 text-pos-info">🧾</div>
          <div>
            <p class="text-sm text-gray-400">Transactions</p>
            <p class="text-2xl font-bold text-pos-text">{stats.todayTransactions}</p>
            <p class="text-xs text-gray-400">aujourd'hui</p>
          </div>
        </div>
      </div>

      <!-- Ticket moyen -->
      <div class="stat-card">
        <div class="flex items-center gap-3">
          <div class="stat-icon bg-pos-warning/20 text-pos-warning">📈</div>
          <div>
            <p class="text-sm text-gray-400">Ticket moyen</p>
            <p class="text-2xl font-bold text-pos-text">{formatPrice(stats.averageTicket)}</p>
            <p class="text-xs text-gray-400">par client</p>
          </div>
        </div>
      </div>

      <!-- Alertes stock -->
      <div class="stat-card">
        <div class="flex items-center gap-3">
          <div class="stat-icon {stats.stockAlerts.length > 0 ? 'bg-pos-danger/20 text-pos-danger' : 'bg-pos-success/20 text-pos-success'}">
            {stats.stockAlerts.length > 0 ? '⚠️' : '✓'}
          </div>
          <div>
            <p class="text-sm text-gray-400">Alertes stock</p>
            <p class="text-2xl font-bold text-pos-text">{stats.stockAlerts.length}</p>
            <p class="text-xs text-gray-400">produits à réapprovisionner</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Graphiques et analyses -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Graphique des ventes par heure (aujourd'hui) -->
      <div class="chart-card">
        <h3 class="text-lg font-bold text-pos-text mb-4">📊 Ventes par heure (aujourd'hui)</h3>
        <div class="h-64 flex items-end gap-1">
          {#each stats.hourlyData || [] as hourData}
            <div class="flex-1 flex flex-col items-center">
              <div
                class="w-full bg-pos-primary rounded-t transition-all duration-300"
                style="height: {maxHourlyRevenue > 0 ? (hourData.revenue / maxHourlyRevenue) * 100 : 0}%"
                title="{formatPrice(hourData.revenue)}"
              ></div>
              <span class="text-xs text-gray-400 mt-1">{formatHour(hourData.hour)}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Analyse du trafic -->
      <div class="chart-card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-pos-text">👥 Analyse du trafic</h3>
          <select
            bind:value={selectedPeriod}
            class="bg-pos-accent text-pos-text px-3 py-1 rounded-lg text-sm"
          >
            <option value={7}>7 derniers jours</option>
            <option value={14}>14 derniers jours</option>
            <option value={30}>30 derniers jours</option>
          </select>
        </div>

        {#if trafficAnalysis}
          <div class="h-48 flex items-end gap-1 mb-4">
            {#each trafficAnalysis.peakHours as hourData}
              <div class="flex-1 flex flex-col items-center">
                <div
                  class="w-full rounded-t transition-all duration-300"
                  style="height: {maxHourlyCustomers > 0 ? (hourData.averageCustomers / maxHourlyCustomers) * 100 : 0}%; background-color: {getTrafficColor(hourData.level)}"
                  title="{hourData.averageCustomers.toFixed(1)} clients/heure en moyenne"
                ></div>
                <span class="text-xs text-gray-400 mt-1">{formatHour(hourData.hour)}</span>
              </div>
            {/each}
          </div>

          <div class="flex gap-4 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded" style="background-color: {getTrafficColor('high')}"></div>
              <span class="text-gray-400">Fort</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded" style="background-color: {getTrafficColor('medium')}"></div>
              <span class="text-gray-400">Modéré</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded" style="background-color: {getTrafficColor('low')}"></div>
              <span class="text-gray-400">Calme</span>
            </div>
          </div>
        {:else}
          <div class="h-48 flex items-center justify-center text-gray-400">
            Pas assez de données
          </div>
        {/if}
      </div>
    </div>

    <!-- Recommandations de personnel -->
    {#if trafficAnalysis && trafficAnalysis.recommendations.length > 0}
      <div class="chart-card mb-6">
        <h3 class="text-lg font-bold text-pos-text mb-4">👨‍💼 Recommandations Personnel</h3>
        <p class="text-gray-400 text-sm mb-4">
          Basé sur l'analyse des {selectedPeriod} derniers jours
          {#if trafficAnalysis.busiestDay !== 'N/A'}
            · Jour le plus chargé : <span class="text-pos-warning">{trafficAnalysis.busiestDay}</span>
          {/if}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each trafficAnalysis.recommendations as rec}
            <div
              class="p-4 rounded-xl border-2"
              style="border-color: {getTrafficColor(rec.trafficLevel)}; background-color: {getTrafficColor(rec.trafficLevel)}10"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-lg font-bold text-pos-text">{rec.timeSlot}</span>
                <span
                  class="px-2 py-1 rounded text-xs font-bold"
                  style="background-color: {getTrafficColor(rec.trafficLevel)}; color: {rec.trafficLevel === 'medium' ? '#1a1a2e' : 'white'}"
                >
                  {getTrafficLabel(rec.trafficLevel)}
                </span>
              </div>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-3xl">👤</span>
                <span class="text-2xl font-bold text-pos-text">× {rec.recommendedStaff}</span>
                <span class="text-gray-400">employé{rec.recommendedStaff > 1 ? 's' : ''}</span>
              </div>
              <p class="text-sm text-gray-400">{rec.reason}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Top produits et alertes stock -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top produits -->
      <div class="chart-card">
        <h3 class="text-lg font-bold text-pos-text mb-4">🏆 Top Produits (aujourd'hui)</h3>
        {#if stats.topProducts.length > 0}
          <div class="space-y-3">
            {#each stats.topProducts.slice(0, 5) as product, index}
              <div class="flex items-center gap-3">
                <span class="text-2xl font-bold text-gray-500 w-8">
                  {#if index === 0}🥇{:else if index === 1}🥈{:else if index === 2}🥉{:else}{index + 1}{/if}
                </span>
                <div class="flex-1">
                  <p class="font-medium text-pos-text">{product.product.name}</p>
                  <p class="text-sm text-gray-400">{product.quantitySold} vendus</p>
                </div>
                <span class="font-bold text-pos-success">{formatPrice(product.revenue)}</span>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center text-gray-400 py-8">
            Aucune vente aujourd'hui
          </div>
        {/if}
      </div>

      <!-- Alertes stock -->
      <div class="chart-card">
        <h3 class="text-lg font-bold text-pos-text mb-4">⚠️ Alertes Stock</h3>
        {#if stats.stockAlerts.length > 0}
          <div class="space-y-3">
            {#each stats.stockAlerts.slice(0, 5) as alert}
              {@const bgColor = alert.status === 'out' ? 'rgba(239, 68, 68, 0.2)' : alert.status === 'critical' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(234, 179, 8, 0.2)'}
              {@const textColor = alert.status === 'out' ? '#f87171' : alert.status === 'critical' ? '#fb923c' : '#facc15'}
              <div class="flex items-center gap-3 p-3 rounded-lg" style="background-color: {bgColor}">
                <span class="text-2xl">
                  {#if alert.status === 'out'}🚫{:else if alert.status === 'critical'}🔴{:else}🟡{/if}
                </span>
                <div class="flex-1">
                  <p class="font-medium text-pos-text">{alert.product.name}</p>
                  <p class="text-sm text-gray-400">
                    Stock: {alert.currentStock} / Min: {alert.minStock}
                  </p>
                </div>
                <span class="text-sm font-bold" style="color: {textColor}">
                  {#if alert.status === 'out'}RUPTURE{:else if alert.status === 'critical'}CRITIQUE{:else}BAS{/if}
                </span>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center text-gray-400 py-8">
            <span class="text-4xl block mb-2">✓</span>
            Tous les stocks sont OK
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .stat-card {
    background: var(--pos-darker);
    border-radius: 1rem;
    padding: 1.25rem;
    border: 1px solid var(--pos-accent);
  }

  .stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .chart-card {
    background: var(--pos-darker);
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid var(--pos-accent);
  }
</style>
