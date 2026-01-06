<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { authStore, currentPermissions } from '$lib/stores/auth';

  let currentTime = $state('');
  let currentDate = $state('');
  let showUserMenu = $state(false);
  let showMobileMenu = $state(false);

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

  const currentPath = $derived($page.url.pathname);
  const user = $derived($authStore);
  const permissions = $derived($currentPermissions);

  // Navigation items filtrés selon les permissions
  const navItems = $derived([
    { href: '/', icon: '🏠', label: 'Caisse', show: true },
    { href: '/dashboard', icon: '📊', label: 'Stats', show: permissions?.canAccessDashboard },
    { href: '/products', icon: '🍽️', label: 'Menu', show: permissions?.canAccessProducts },
    { href: '/employees', icon: '👥', label: 'Équipe', show: permissions?.canAccessEmployees },
    { href: '/live', icon: '📡', label: 'Live', show: permissions?.canViewRemotely },
    { href: '/settings', icon: '⚙️', label: 'Config', show: permissions?.canAccessSettings }
  ].filter(item => item.show));
</script>

<header class="header-glass">
  <div class="header-left">
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

    <!-- Séparateur (desktop only) -->
    <div class="separator desktop-only"></div>

    <!-- Navigation Desktop -->
    <nav class="nav-container desktop-only">
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

  <!-- Droite: Date/Heure + User + Menu Mobile -->
  <div class="header-right">
    <!-- Date/Heure stylisée (desktop only) -->
    <div class="time-display desktop-only">
      <span class="time-value">{currentTime}</span>
      <span class="time-date">{currentDate}</span>
    </div>

    <!-- Séparateur desktop -->
    <div class="separator desktop-only"></div>

    <!-- Bouton menu mobile -->
    <button class="mobile-menu-btn mobile-only" onclick={() => showMobileMenu = !showMobileMenu}>
      <span class="menu-icon">{showMobileMenu ? '✕' : '☰'}</span>
    </button>

    <!-- Utilisateur connecté -->
    {#if user}
      <div class="user-container">
        <button
          class="user-button"
          onclick={() => showUserMenu = !showUserMenu}
        >
          <div class="user-avatar" style="--role-color: {getRoleColor(user.role)}">
            <span>{getRoleIcon(user.role)}</span>
          </div>
          <div class="user-info desktop-only">
            <span class="user-name">{user.name}</span>
            <span class="user-role" style="color: {getRoleColor(user.role)}">{getRoleLabel(user.role)}</span>
          </div>
          <svg class="chevron desktop-only" class:open={showUserMenu} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
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
              <a href="/live" class="menu-item" onclick={() => showUserMenu = false}>
                <span>📡</span>
                <span>Suivi en direct</span>
              </a>
            {/if}

            <button class="menu-item danger" onclick={logout}>
              <span>🚪</span>
              <span>Déconnexion</span>
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</header>

<!-- Navigation Mobile Drawer -->
{#if showMobileMenu}
  <div class="mobile-nav-overlay" onclick={() => showMobileMenu = false}></div>
  <nav class="mobile-nav">
    <div class="mobile-nav-header">
      <span class="mobile-nav-title">Menu</span>
      <span class="mobile-nav-time">{currentTime}</span>
    </div>
    <div class="mobile-nav-items">
      {#each navItems as item}
        <a
          href={item.href}
          class="mobile-nav-item"
          class:active={currentPath === item.href}
          onclick={() => showMobileMenu = false}
        >
          <span class="mobile-nav-icon">{item.icon}</span>
          <span class="mobile-nav-label">{item.label}</span>
          {#if currentPath === item.href}
            <span class="mobile-nav-active">●</span>
          {/if}
        </a>
      {/each}
    </div>
    <div class="mobile-nav-footer">
      <button class="mobile-logout-btn" onclick={logout}>
        <span>🚪</span>
        <span>Déconnexion</span>
      </button>
    </div>
  </nav>
{/if}

<!-- Overlay pour fermer le menu utilisateur -->
{#if showUserMenu}
  <button
    class="fixed inset-0 z-40 bg-transparent"
    onclick={() => showUserMenu = false}
    aria-label="Fermer le menu"
  ></button>
{/if}

<style>
  .header-glass {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: rgba(18, 18, 43, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .separator {
    height: 2rem;
    width: 1px;
    background: rgba(255, 255, 255, 0.1);
  }

  /* Responsive helpers */
  .desktop-only {
    display: flex;
  }

  .mobile-only {
    display: none;
  }

  @media (max-width: 900px) {
    .desktop-only {
      display: none !important;
    }
    .mobile-only {
      display: flex !important;
    }
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
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  }

  .logo-emoji {
    font-size: 1.25rem;
    position: relative;
    z-index: 1;
  }

  .logo-glow {
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
    border-radius: 12px;
    opacity: 0.5;
    filter: blur(8px);
    z-index: 0;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 1.1rem;
    font-weight: 800;
    background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.2;
  }

  .brand-subtitle {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  /* Navigation Desktop */
  .nav-container {
    display: flex;
    gap: 0.25rem;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .nav-container::-webkit-scrollbar {
    display: none;
  }

  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
    white-space: nowrap;
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
    font-size: 1rem;
  }

  .nav-indicator {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 2px;
    background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
    border-radius: 2px 2px 0 0;
  }

  /* Time Display */
  .time-display {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .time-value {
    font-size: 1.25rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
  }

  .time-date {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: capitalize;
  }

  /* Mobile Menu Button */
  .mobile-menu-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mobile-menu-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  /* User Button */
  .user-container {
    position: relative;
  }

  .user-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .user-button:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    background: color-mix(in srgb, var(--role-color) 20%, transparent);
    border: 1px solid color-mix(in srgb, var(--role-color) 30%, transparent);
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-right: 0.25rem;
  }

  .user-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: white;
    line-height: 1.2;
  }

  .user-role {
    font-size: 0.65rem;
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

  /* Mobile Navigation */
  .mobile-nav-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 90;
    animation: fadeIn 0.2s ease;
  }

  .mobile-nav {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 280px;
    max-width: 85vw;
    background: rgba(18, 18, 43, 0.98);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 100;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .mobile-nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mobile-nav-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
  }

  .mobile-nav-time {
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    font-variant-numeric: tabular-nums;
  }

  .mobile-nav-items {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
  }

  .mobile-nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.15s ease;
    margin-bottom: 0.25rem;
  }

  .mobile-nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .mobile-nav-item.active {
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(78, 205, 196, 0.2) 100%);
    color: white;
  }

  .mobile-nav-icon {
    font-size: 1.25rem;
    width: 32px;
    text-align: center;
  }

  .mobile-nav-label {
    flex: 1;
  }

  .mobile-nav-active {
    font-size: 0.5rem;
    color: #4ecdc4;
  }

  .mobile-nav-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mobile-logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.875rem;
    background: rgba(231, 76, 60, 0.15);
    border: 1px solid rgba(231, 76, 60, 0.3);
    border-radius: 12px;
    color: #e74c3c;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mobile-logout-btn:hover {
    background: rgba(231, 76, 60, 0.25);
  }
</style>
