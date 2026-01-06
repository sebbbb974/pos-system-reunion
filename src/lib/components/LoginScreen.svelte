<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '$lib/stores/auth';

  const dispatch = createEventDispatcher<{ login: void }>();

  let pin = $state('');
  let error = $state('');
  let isLoading = $state(false);
  let shake = $state(false);

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

    await new Promise(resolve => setTimeout(resolve, 400));

    const result = authStore.login(pin);

    if (result.success) {
      dispatch('login');
    } else {
      error = result.error || 'Code PIN invalide';
      shake = true;
      setTimeout(() => { shake = false; }, 500);
      pin = '';
    }

    isLoading = false;
  }

  // Auto-submit quand 4 chiffres sont entrés
  $effect(() => {
    if (pin.length === 4) {
      handleLogin();
    }
  });

  const numpadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '⌫']
  ];
</script>

<div class="login-screen">
  <!-- Fond animé -->
  <div class="bg-pattern">
    <div class="bg-circle circle-1"></div>
    <div class="bg-circle circle-2"></div>
    <div class="bg-circle circle-3"></div>
  </div>

  <div class="login-container">
    <!-- Logo Premium -->
    <div class="logo-section">
      <div class="logo-wrapper">
        <div class="logo-bg"></div>
        <span class="logo-emoji">🌴</span>
        <div class="logo-ring"></div>
      </div>
      <h1 class="brand-title">
        <span class="brand-ti">Ti</span><span class="brand-kaisse">Kaisse</span>
      </h1>
      <p class="brand-subtitle">Système de caisse • La Réunion</p>
    </div>

    <!-- Carte PIN -->
    <div class="pin-card" class:shake>
      <div class="pin-header">
        <div class="pin-icon">🔐</div>
        <p class="pin-label">Entrez votre code PIN</p>
      </div>

      <!-- Indicateurs PIN -->
      <div class="pin-display">
        {#each [0, 1, 2, 3] as index}
          <div class="pin-dot" class:filled={pin.length > index} class:active={pin.length === index}>
            {#if pin.length > index}
              <span class="dot-filled"></span>
            {/if}
          </div>
        {/each}
      </div>

      {#if error}
        <p class="error-message">{error}</p>
      {/if}

      {#if isLoading}
        <div class="loading-bar">
          <div class="loading-progress"></div>
        </div>
      {/if}
    </div>

    <!-- Pavé numérique -->
    <div class="numpad">
      {#each numpadButtons as row}
        {#each row as btn}
          <button
            class="numpad-btn"
            class:danger={btn === 'C'}
            class:warning={btn === '⌫'}
            class:number={!['C', '⌫'].includes(btn)}
            onclick={() => {
              if (btn === 'C') clearPin();
              else if (btn === '⌫') removeDigit();
              else addDigit(btn);
            }}
            disabled={isLoading}
          >
            <span class="btn-content">{btn}</span>
            <div class="btn-shine"></div>
          </button>
        {/each}
      {/each}
    </div>

    <!-- Aide codes PIN -->
    <div class="help-section">
      <p class="help-title">Codes PIN par défaut</p>
      <div class="help-codes">
        <div class="code-item owner">
          <span class="code-icon">👑</span>
          <span class="code-label">Patron</span>
          <span class="code-value">1234</span>
        </div>
        <div class="code-item secretary">
          <span class="code-icon">📋</span>
          <span class="code-label">Secrétaire</span>
          <span class="code-value">5678</span>
        </div>
        <div class="code-item employee">
          <span class="code-icon">👤</span>
          <span class="code-label">Employés</span>
          <span class="code-value">1111, 2222</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .login-screen {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #0c0c1e 0%, #1a1a3e 50%, #0c0c1e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    overflow: hidden;
  }

  /* Fond animé */
  .bg-pattern {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .bg-circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.3;
  }

  .circle-1 {
    width: 500px;
    height: 500px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
    top: -200px;
    right: -100px;
    animation: float 20s ease-in-out infinite;
  }

  .circle-2 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, #4ecdc4 0%, #7ee8e1 100%);
    bottom: -150px;
    left: -100px;
    animation: float 15s ease-in-out infinite reverse;
  }

  .circle-3 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, #ffe66d 0%, #ffed8a 100%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulse 10s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(30px, 30px); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.1); }
  }

  .login-container {
    position: relative;
    width: 100%;
    max-width: 400px;
    padding: 2rem;
    z-index: 1;
  }

  /* Logo Section */
  .logo-section {
    text-align: center;
    margin-bottom: 2rem;
  }

  .logo-wrapper {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 0 auto 1.25rem;
  }

  .logo-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
    border-radius: 28px;
    transform: rotate(-10deg);
    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.4);
  }

  .logo-emoji {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3.5rem;
    z-index: 1;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }

  .logo-ring {
    position: absolute;
    inset: -8px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 32px;
    animation: spin 20s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .brand-title {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 0.25rem;
  }

  .brand-ti {
    color: #ff6b6b;
    text-shadow: 0 0 30px rgba(255, 107, 107, 0.5);
  }

  .brand-kaisse {
    color: #4ecdc4;
    text-shadow: 0 0 30px rgba(78, 205, 196, 0.5);
  }

  .brand-subtitle {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.05em;
  }

  /* PIN Card */
  .pin-card {
    background: rgba(30, 30, 63, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  .pin-card.shake {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-10px); }
    40%, 80% { transform: translateX(10px); }
  }

  .pin-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .pin-icon {
    font-size: 1.25rem;
  }

  .pin-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .pin-display {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .pin-dot {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .pin-dot.active {
    border-color: rgba(78, 205, 196, 0.5);
    box-shadow: 0 0 20px rgba(78, 205, 196, 0.2);
  }

  .pin-dot.filled {
    background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
    border-color: transparent;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
  }

  .dot-filled {
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

  .error-message {
    text-align: center;
    color: #ff6b6b;
    font-size: 0.85rem;
    margin-top: 1rem;
    font-weight: 500;
  }

  .loading-bar {
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin-top: 1rem;
    overflow: hidden;
  }

  .loading-progress {
    height: 100%;
    width: 30%;
    background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
    border-radius: 2px;
    animation: loading 0.8s ease-in-out infinite;
  }

  @keyframes loading {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }

  /* Numpad */
  .numpad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .numpad-btn {
    position: relative;
    height: 64px;
    border-radius: 16px;
    font-size: 1.5rem;
    font-weight: 700;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.15s ease;
    touch-action: manipulation;
  }

  .numpad-btn.number {
    background: rgba(30, 30, 63, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
  }

  .numpad-btn.number:hover {
    background: rgba(78, 205, 196, 0.2);
    border-color: rgba(78, 205, 196, 0.3);
  }

  .numpad-btn.danger {
    background: rgba(255, 107, 107, 0.15);
    border: 1px solid rgba(255, 107, 107, 0.3);
    color: #ff6b6b;
  }

  .numpad-btn.danger:hover {
    background: rgba(255, 107, 107, 0.25);
  }

  .numpad-btn.warning {
    background: rgba(255, 230, 109, 0.15);
    border: 1px solid rgba(255, 230, 109, 0.3);
    color: #ffe66d;
  }

  .numpad-btn.warning:hover {
    background: rgba(255, 230, 109, 0.25);
  }

  .numpad-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .numpad-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-content {
    position: relative;
    z-index: 1;
  }

  .btn-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  /* Help Section */
  .help-section {
    text-align: center;
  }

  .help-title {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .help-codes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .code-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    font-size: 0.85rem;
  }

  .code-icon {
    font-size: 1rem;
  }

  .code-label {
    color: rgba(255, 255, 255, 0.5);
    flex: 1;
    text-align: left;
  }

  .code-value {
    font-family: 'Monaco', 'Consolas', monospace;
    font-weight: 600;
  }

  .code-item.owner .code-value {
    color: #ffe66d;
  }

  .code-item.secretary .code-value {
    color: #4ecdc4;
  }

  .code-item.employee .code-value {
    color: rgba(255, 255, 255, 0.6);
  }
</style>
