<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import LoginScreen from '$lib/components/LoginScreen.svelte';
  import { authStore, isAuthenticated, currentPermissions } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let { children } = $props();

  let isMobile = $state(false);
  let showMobileWarning = $state(false);
  let dismissedWarning = $state(false);

  onMount(() => {
    // Détecter si on est sur mobile
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });

  function checkMobile() {
    isMobile = window.innerWidth < 768 ||
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Afficher l'avertissement mobile si on n'est pas sur /live et pas déjà dismissé
  $effect(() => {
    if (isMobile && $isAuthenticated && !dismissedWarning) {
      const currentPath = $page?.url?.pathname || '';
      // Montrer warning si pas sur live et pas sur login
      if (!currentPath.includes('/live')) {
        showMobileWarning = true;
      } else {
        showMobileWarning = false;
      }
    }
  });

  function goToLive() {
    showMobileWarning = false;
    goto('/live');
  }

  function dismissWarning() {
    showMobileWarning = false;
    dismissedWarning = true;
  }

  function handleLogin() {
    // L'utilisateur est connecté, le composant se rafraîchit automatiquement
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

{#if $isAuthenticated}
  <div class="h-screen flex flex-col bg-pos-dark">
    <Header />
    <main class="flex-1 overflow-hidden">
      {@render children()}
    </main>
  </div>

  <!-- Modal d'avertissement mobile -->
  {#if showMobileWarning && $currentPermissions?.canViewRemotely}
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
      <div class="bg-pos-darker rounded-2xl w-full max-w-md p-6 shadow-2xl border border-pos-accent">
        <div class="text-center mb-6">
          <span class="text-6xl block mb-4">📱</span>
          <h2 class="text-2xl font-bold text-pos-text mb-2">Vous êtes sur mobile</h2>
          <p class="text-gray-400">
            L'interface de caisse est optimisée pour les grands écrans.
            Voulez-vous accéder au <strong class="text-pos-primary">suivi en direct</strong> à la place ?
          </p>
        </div>

        <div class="space-y-3">
          <button
            class="w-full py-4 bg-pos-primary text-white rounded-xl font-bold text-lg hover:bg-pos-primary/80 transition-colors flex items-center justify-center gap-2"
            on:click={goToLive}
          >
            <span class="text-2xl">📊</span>
            Aller sur Live
          </button>

          <button
            class="w-full py-3 bg-pos-accent text-pos-text rounded-xl font-medium hover:bg-pos-dark transition-colors"
            on:click={dismissWarning}
          >
            Continuer sur la caisse quand même
          </button>
        </div>

        <p class="text-xs text-gray-500 text-center mt-4">
          Vous pouvez toujours accéder à Live depuis le menu
        </p>
      </div>
    </div>
  {/if}

  <!-- Si l'utilisateur mobile n'a pas accès à Live -->
  {#if showMobileWarning && !$currentPermissions?.canViewRemotely}
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
      <div class="bg-pos-darker rounded-2xl w-full max-w-md p-6 shadow-2xl border border-pos-accent">
        <div class="text-center mb-6">
          <span class="text-6xl block mb-4">📱</span>
          <h2 class="text-2xl font-bold text-pos-text mb-2">Écran non adapté</h2>
          <p class="text-gray-400">
            L'interface de caisse est conçue pour les écrans tactiles de caisse (tablette/PC).
            L'utilisation sur smartphone n'est pas recommandée.
          </p>
        </div>

        <button
          class="w-full py-3 bg-pos-accent text-pos-text rounded-xl font-medium hover:bg-pos-dark transition-colors"
          on:click={dismissWarning}
        >
          J'ai compris, continuer
        </button>
      </div>
    </div>
  {/if}
{:else}
  <LoginScreen on:login={handleLogin} />
{/if}
