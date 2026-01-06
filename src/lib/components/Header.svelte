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
      minute: '2-digit'
    });
    currentDate = now.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  function logout() {
    authStore.logout();
    showUserMenu = false;
  }

  function getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      owner: '#2ecc71',
      secretary: '#3498db',
      employee: '#f1c40f'
    };
    return colors[role] || '#95a5a6';
  }

  function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      owner: 'Patron',
      secretary: 'Secrétaire',
      employee: 'Employé'
    };
    return labels[role] || role;
  }

  function getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      owner: '👑',
      secretary: '📋',
      employee: '👤'
    };
    return icons[role] || '👤';
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
    { href: '/', icon: '🏠', label: 'Caisse', show: true },
    { href: '/dashboard', icon: '📊', label: 'Stats', show: permissions?.canAccessDashboard },
    { href: '/products', icon: '🍽️', label: 'Menu', show: permissions?.canAccessProducts },
    { href: '/employees', icon: '👥', label: 'Équipe', show: permissions?.canAccessEmployees },
    { href: '/live', icon: '📡', label: 'Live', show: permissions?.canViewRemotely },
    { href: '/settings', icon: '⚙️', label: 'Config', show: permissions?.canAccessSettings }
  ].filter(item => item.show);
</script>

<header class="header-glass">
  <div class="flex items-center gap-6">
    <!-- Logo Premium -->
    <a href="/" class="logo-container">
      <div class="logo-icon">
        <span class="logo-emoji">🌴</span>
        <div class="logo-glow"></div>
      </div>
      <div class="logo-text">
        <span class="brand-name">TiKaisse</span>
        <span class="brand-subtitle">La Réunion</span>
      </div>
    </a>

    <!-- Séparateur -->
    <div class="h-8 w-px bg-white/10"></div>

    <!-- Navigation -->
    <nav class="nav-container">
      {#each navItems as item}
        <a
          href={item.href}
          class="nav-item"
          class:active={currentPath === item.href}
        >
          <span class="nav-icon">{item.icon}</span>
          <span class="nav-label">{item.label}</span>
          {#if currentPath === item.href}
            <div class="nav-indicator"></div>
          {/if}
        </a>
      {/each}
    </nav>
  </div>

  <!-- Droite: Date/Heure + User -->
  <div class="flex items-center gap-4">
    <!-- Date/Heure stylisée -->
    <div class="time-display">
      <span class="time-value">{currentTime}</span>
      <span class="time-date">{currentDate}</span>
    </div>

    <!-- Séparateur -->
    <div class="h-8 w-px bg-white/10"></div>

    <!-- Utilisateur connecté -->
    {#if user}
      <div class="relative">
        <button
          class="user-button"
          on:click={() => showUserMenu = !showUserMenu}
        >
          <div class="user-avatar" style="--role-color: {getRoleColor(user.role)}">
            <span>{getRoleIcon(user.role)}</span>
          </div>
          <div class="user-info">
            <span class="user-name">{user.name}</span>
            <span class="user-role" style="color: {getRoleColor(user.role)}">{getRoleLabel(user.role)}</span>
          </div>
          <svg class="chevron" class:open={showUserMenu} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </button>

        <!-- Menu déroulant -->
        {#if showUserMenu}
          <div class="user-menu slide-up">
            <div class="menu-header">
              <div class="menu-avatar" style="--role-color: {getRoleColor(user.role)}">
                {getRoleIcon(user.role)}
              </div>
              <div>
                <p class="menu-name">{user.name}</p>
                <p class="menu-role" style="color: {getRoleColor(user.role)}">{getRoleLabel(user.role)}</p>
              </div>
            </div>

            <div class="menu-divider"></div>

            {#if permissions?.canViewRemotely}
              <a href="/live" class="menu-item" on:click={() => showUserMenu = false}>
                <span>📡</span>
                <span>Suivi en direct</span>
              </a>
            {/if}

            <button class="menu-item danger" on:click={logout}>
              <span>🚪</span>
              <span>Déconnexion</span>
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
    class="fixed inset-0 z-40 bg-transparent"
    on:click={() => showUserMenu = false}
    aria-label="Fermer le menu"
  ></button>
{/if}

<style>
  .header-glass {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: rgba(18, 18, 43, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Logo */
  .logo-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
  }

  .logo-icon {
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  }

  .logo-emoji {
    font-size: 1.5rem;
    position: relative;
    z-index: 1;
  }

  .logo-glow {
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
    border-radius: 14px;
    opacity: 0.5;
    filter: blur(8px);
    z-index: 0;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 1.25rem;
    font-weight: 800;
    background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.2;
  }

  .brand-subtitle {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  /* Navigation */
  .nav-container {
    display: flex;
    gap: 0.25rem;
  }

  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .nav-item:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  .nav-item.active {
    color: white;
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(78, 205, 196, 0.2) 100%);
  }

  .nav-icon {
    font-size: 1.1rem;
  }

  .nav-indicator {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
    border-radius: 3px 3px 0 0;
  }

  /* Time Display */
  .time-display {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .time-value {
    font-size: 1.5rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
  }

  .time-date {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: capitalize;
  }

  /* User Button */
  .user-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .user-button:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    background: color-mix(in srgb, var(--role-color) 20%, transparent);
    border: 1px solid color-mix(in srgb, var(--role-color) 30%, transparent);
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .user-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    line-height: 1.2;
  }

  .user-role {
    font-size: 0.7rem;
    font-weight: 500;
    line-height: 1.2;
  }

  .chevron {
    color: rgba(255, 255, 255, 0.4);
    transition: transform 0.2s ease;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  /* User Menu Dropdown */
  .user-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    width: 220px;
    background: rgba(18, 18, 43, 0.98);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    z-index: 50;
  }

  .menu-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
  }

  .menu-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    background: color-mix(in srgb, var(--role-color) 20%, transparent);
  }

  .menu-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: white;
  }

  .menu-role {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .menu-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: all 0.15s ease;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  .menu-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .menu-item.danger {
    color: #e74c3c;
  }

  .menu-item.danger:hover {
    background: rgba(231, 76, 60, 0.1);
  }
</style>
