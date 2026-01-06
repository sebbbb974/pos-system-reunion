<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import LoginScreen from '$lib/components/LoginScreen.svelte';
  import { authStore, isAuthenticated } from '$lib/stores/auth';

  let { children } = $props();

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
{:else}
  <LoginScreen on:login={handleLogin} />
{/if}
