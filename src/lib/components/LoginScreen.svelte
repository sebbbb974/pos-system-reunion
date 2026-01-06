<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '$lib/stores/auth';

  const dispatch = createEventDispatcher<{ login: void }>();

  let pin = '';
  let error = '';
  let isLoading = false;

  function addDigit(digit: string) {
    if (pin.length < 4) {
      pin += digit;
      error = '';
    }
  }

  function removeDigit() {
    pin = pin.slice(0, -1);
    error = '';
  }

  function clearPin() {
    pin = '';
    error = '';
  }

  async function handleLogin() {
    if (pin.length !== 4) {
      error = 'Entrez un code à 4 chiffres';
      return;
    }

    isLoading = true;
    error = '';

    // Simuler un petit délai
    await new Promise(resolve => setTimeout(resolve, 300));

    const result = authStore.login(pin);

    if (result.success) {
      dispatch('login');
    } else {
      error = result.error || 'Code PIN invalide';
      pin = '';
    }

    isLoading = false;
  }

  // Auto-submit quand 4 chiffres sont entrés
  $: if (pin.length === 4) {
    handleLogin();
  }

  const numpadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '⌫']
  ];
</script>

<div class="fixed inset-0 bg-pos-dark flex items-center justify-center z-50">
  <div class="w-full max-w-md p-8">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="w-20 h-20 bg-pos-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span class="text-5xl">🏪</span>
      </div>
      <h1 class="text-3xl font-bold text-pos-text">POS System</h1>
      <p class="text-gray-400 mt-1">La Réunion</p>
    </div>

    <!-- Affichage du PIN -->
    <div class="bg-pos-darker rounded-2xl p-6 mb-6">
      <p class="text-center text-gray-400 mb-4">Entrez votre code PIN</p>

      <div class="flex justify-center gap-3 mb-4">
        {#each [0, 1, 2, 3] as index}
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all
                   {pin.length > index ? 'bg-pos-primary text-white' : 'bg-pos-accent text-gray-500'}"
          >
            {pin.length > index ? '•' : ''}
          </div>
        {/each}
      </div>

      {#if error}
        <p class="text-center text-pos-danger text-sm animate-pulse">{error}</p>
      {/if}
    </div>

    <!-- Pavé numérique -->
    <div class="grid grid-cols-3 gap-3">
      {#each numpadButtons as row}
        {#each row as btn}
          <button
            class="numpad-btn h-16 text-2xl font-bold rounded-xl transition-all
                   {btn === 'C' ? 'bg-pos-danger/30 text-pos-danger' : ''}
                   {btn === '⌫' ? 'bg-pos-warning/30 text-pos-warning' : ''}
                   {!['C', '⌫'].includes(btn) ? 'bg-pos-accent text-pos-text hover:bg-pos-primary' : ''}"
            on:click={() => {
              if (btn === 'C') clearPin();
              else if (btn === '⌫') removeDigit();
              else addDigit(btn);
            }}
            disabled={isLoading}
          >
            {btn}
          </button>
        {/each}
      {/each}
    </div>

    <!-- Aide -->
    <div class="mt-8 text-center text-sm text-gray-500">
      <p>Codes PIN par défaut :</p>
      <p class="mt-1">
        <span class="text-pos-success">Patron: 1234</span> •
        <span class="text-pos-info">Secrétaire: 5678</span>
      </p>
      <p class="mt-1">
        <span class="text-gray-400">Employés: 1111, 2222, 3333</span>
      </p>
    </div>
  </div>
</div>

<style>
  .numpad-btn {
    touch-action: manipulation;
  }

  .numpad-btn:active:not(:disabled) {
    transform: scale(0.95);
    opacity: 0.8;
  }

  .numpad-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
