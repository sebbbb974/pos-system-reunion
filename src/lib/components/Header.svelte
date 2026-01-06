<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { authStore, currentPermissions } from '$lib/stores/auth';

  let currentTime = '';
  let currentDate = '';
  let showUserMenu = false;

  function updateDateTime() {
    const now = new Date();
    currentTime = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    currentDate = now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function logout() {
    authStore.logout();
    showUserMenu = false;
  }

  function getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      owner: '#4ade80',
      secretary: '#3b82f6',
      employee: '#fbbf24'
    };
    return colors[role] || '#6b7280';
  }

  function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      owner: 'Patron',
      secretary: 'Secrétaire',
      employee: 'Employé'
    };
    return labels[role] || role;
  }

  onMount(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  });

  $: currentPath = $page.url.pathname;
  $: user = $authStore;
  $: permissions = $currentPermissions;

  // Navigation items filtrés selon les permissions
  $: navItems = [
    { href: '/', icon: '💰', label: 'Caisse', show: true },
    { href: '/dashboard', icon: '📊', label: 'Dashboard', show: permissions?.canAccessDashboard },
    { href: '/products', icon: '📦', label: 'Produits', show: permissions?.canAccessProducts },
    { href: '/employees', icon: '👥', label: 'Personnel', show: permissions?.canAccessEmployees },
    { href: '/live', icon: '📱', label: 'Live', show: permissions?.canViewRemotely },
    { href: '/settings', icon: '⚙️', label: 'Paramètres', show: permissions?.canAccessSettings }
  ].filter(item => item.show);
</script>

<header class="flex items-center justify-between px-4 py-3 bg-pos-darker border-b border-pos-accent">
  <!-- Logo / Nom -->
  <div class="flex items-center gap-3">
    <div class="w-10 h-10 bg-pos-primary rounded-xl flex items-center justify-center">
      <span class="text-2xl">🏪</span>
    </div>
    <div>
      <h1 class="text-lg font-bold text-pos-text">POS System</h1>
      <p class="text-xs text-gray-400">La Réunion</p>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="flex items-center gap-2">
    {#each navItems as item}
      <a
        href={item.href}
        class="nav-btn"
        class:active={currentPath === item.href}
      >
        <span>{item.icon}</span>
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>

  <!-- Utilisateur + Date/Heure -->
  <div class="flex items-center gap-4">
    <!-- Date/Heure -->
    <div class="text-right">
      <p class="text-xl font-bold text-pos-text font-mono">{currentTime}</p>
      <p class="text-xs text-gray-400 capitalize">{currentDate}</p>
    </div>

    <!-- Utilisateur connecté -->
    {#if user}
      <div class="relative">
        <button
          class="flex items-center gap-2 px-3 py-2 rounded-xl bg-pos-accent hover:bg-pos-primary transition-colors"
          on:click={() => showUserMenu = !showUserMenu}
        >
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-lg"
               style="background-color: {getRoleColor(user.role)}20; color: {getRoleColor(user.role)}">
            👤
          </div>
          <div class="text-left">
            <p class="text-sm font-medium text-pos-text">{user.name}</p>
            <p class="text-xs" style="color: {getRoleColor(user.role)}">{getRoleLabel(user.role)}</p>
          </div>
          <span class="text-gray-400 text-sm">▼</span>
        </button>

        <!-- Menu déroulant -->
        {#if showUserMenu}
          <div class="absolute right-0 top-full mt-2 w-48 bg-pos-darker border border-pos-accent rounded-xl shadow-lg overflow-hidden z-50">
            <div class="px-4 py-3 border-b border-pos-accent">
              <p class="text-sm text-pos-text font-medium">{user.name}</p>
              <p class="text-xs text-gray-400">{getRoleLabel(user.role)}</p>
            </div>
            {#if permissions?.canViewRemotely}
              <a href="/live" class="block px-4 py-2 text-sm text-pos-text hover:bg-pos-accent transition-colors">
                📱 Suivi en direct
              </a>
            {/if}
            <button
              class="w-full px-4 py-2 text-sm text-left text-pos-danger hover:bg-pos-danger/20 transition-colors"
              on:click={logout}
            >
              🚪 Déconnexion
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</header>

<!-- Overlay pour fermer le menu -->
{#if showUserMenu}
  <button
    class="fixed inset-0 z-40"
    on:click={() => showUserMenu = false}
    aria-label="Fermer le menu"
  ></button>
{/if}

<style>
  .nav-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    color: var(--pos-text);
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.15s ease;
    text-decoration: none;
  }

  .nav-btn:hover {
    background: var(--pos-accent);
  }

  .nav-btn.active {
    background: var(--pos-primary);
  }

  .nav-btn span:first-child {
    font-size: 1.25rem;
  }
</style>
