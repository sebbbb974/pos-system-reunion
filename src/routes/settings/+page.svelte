<script lang="ts">
  import { onMount } from 'svelte';

  // Paramètres du commerce
  let shopSettings = {
    name: 'Mon Commerce',
    address: '123 Rue du Commerce',
    city: '97400 Saint-Denis',
    phone: '0262 00 00 00',
    siret: '',
    tvaNumber: ''
  };

  // Paramètres d'impression
  let printSettings = {
    autoPrint: false,
    printLogo: true,
    footerMessage: 'Merci de votre visite !'
  };

  // Paramètres d'affichage
  let displaySettings = {
    theme: 'dark',
    soundEnabled: true,
    showStock: true
  };

  function loadSettings() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('pos_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        shopSettings = { ...shopSettings, ...parsed.shop };
        printSettings = { ...printSettings, ...parsed.print };
        displaySettings = { ...displaySettings, ...parsed.display };
      }
    }
  }

  function saveSettings() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pos_settings', JSON.stringify({
        shop: shopSettings,
        print: printSettings,
        display: displaySettings
      }));
    }
    alert('Paramètres enregistrés !');
  }

  function exportData() {
    const data = {
      products: localStorage.getItem('pos_products'),
      transactions: localStorage.getItem('pos_transactions'),
      settings: localStorage.getItem('pos_settings')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.products) localStorage.setItem('pos_products', data.products);
        if (data.transactions) localStorage.setItem('pos_transactions', data.transactions);
        if (data.settings) localStorage.setItem('pos_settings', data.settings);
        alert('Données importées ! Rechargez la page pour voir les changements.');
        location.reload();
      } catch {
        alert('Erreur lors de l\'import du fichier');
      }
    };
    reader.readAsText(file);
  }

  function clearAllData() {
    if (confirm('Êtes-vous sûr de vouloir effacer TOUTES les données ? Cette action est irréversible.')) {
      localStorage.clear();
      alert('Toutes les données ont été effacées.');
      location.reload();
    }
  }

  onMount(loadSettings);
</script>

<svelte:head>
  <title>Paramètres - POS System</title>
</svelte:head>

<div class="h-full overflow-y-auto p-6">
  <div class="max-w-4xl mx-auto">
    <!-- En-tête -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-pos-text">Paramètres</h1>
      <p class="text-gray-400">Configuration de votre système de caisse</p>
    </div>

    <div class="space-y-6">
      <!-- Informations du commerce -->
      <div class="settings-card">
        <h2 class="text-xl font-bold text-pos-text mb-4 flex items-center gap-2">
          <span>🏪</span> Informations du commerce
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Nom du commerce</label>
            <input
              type="text"
              bind:value={shopSettings.name}
              class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Téléphone</label>
            <input
              type="tel"
              bind:value={shopSettings.phone}
              class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Adresse</label>
            <input
              type="text"
              bind:value={shopSettings.address}
              class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Ville / Code postal</label>
            <input
              type="text"
              bind:value={shopSettings.city}
              class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">N° SIRET</label>
            <input
              type="text"
              bind:value={shopSettings.siret}
              placeholder="123 456 789 00012"
              class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">N° TVA Intracommunautaire</label>
            <input
              type="text"
              bind:value={shopSettings.tvaNumber}
              placeholder="FR12345678901"
              class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
            />
          </div>
        </div>
      </div>

      <!-- Paramètres d'impression -->
      <div class="settings-card">
        <h2 class="text-xl font-bold text-pos-text mb-4 flex items-center gap-2">
          <span>🖨️</span> Impression
        </h2>
        <div class="space-y-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={printSettings.autoPrint}
              class="w-5 h-5 rounded bg-pos-accent border-pos-accent text-pos-primary focus:ring-pos-primary"
            />
            <span class="text-pos-text">Imprimer automatiquement le ticket après paiement</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={printSettings.printLogo}
              class="w-5 h-5 rounded bg-pos-accent border-pos-accent text-pos-primary focus:ring-pos-primary"
            />
            <span class="text-pos-text">Afficher le logo sur les tickets</span>
          </label>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Message de pied de ticket</label>
            <input
              type="text"
              bind:value={printSettings.footerMessage}
              class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
            />
          </div>
        </div>
      </div>

      <!-- Paramètres d'affichage -->
      <div class="settings-card">
        <h2 class="text-xl font-bold text-pos-text mb-4 flex items-center gap-2">
          <span>🎨</span> Affichage
        </h2>
        <div class="space-y-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={displaySettings.soundEnabled}
              class="w-5 h-5 rounded bg-pos-accent border-pos-accent text-pos-primary focus:ring-pos-primary"
            />
            <span class="text-pos-text">Activer les sons</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={displaySettings.showStock}
              class="w-5 h-5 rounded bg-pos-accent border-pos-accent text-pos-primary focus:ring-pos-primary"
            />
            <span class="text-pos-text">Afficher les alertes de stock sur la caisse</span>
          </label>
        </div>
      </div>

      <!-- Sauvegarde / Import / Export -->
      <div class="settings-card">
        <h2 class="text-xl font-bold text-pos-text mb-4 flex items-center gap-2">
          <span>💾</span> Données
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            class="py-3 px-4 bg-pos-info text-white rounded-xl font-medium hover:bg-blue-400 transition-colors flex items-center justify-center gap-2"
            on:click={exportData}
          >
            <span>📤</span> Exporter les données
          </button>
          <label class="py-3 px-4 bg-pos-warning text-pos-dark rounded-xl font-medium hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <span>📥</span> Importer des données
            <input type="file" accept=".json" class="hidden" on:change={importData} />
          </label>
          <button
            class="py-3 px-4 bg-pos-danger text-white rounded-xl font-medium hover:bg-red-400 transition-colors flex items-center justify-center gap-2"
            on:click={clearAllData}
          >
            <span>🗑️</span> Effacer tout
          </button>
        </div>
        <p class="text-sm text-gray-400 mt-3">
          ⚠️ Pensez à exporter régulièrement vos données pour éviter toute perte.
        </p>
      </div>

      <!-- Conformité NF525 -->
      <div class="settings-card border-pos-warning">
        <h2 class="text-xl font-bold text-pos-warning mb-4 flex items-center gap-2">
          <span>⚖️</span> Conformité NF525
        </h2>
        <div class="bg-pos-warning/10 rounded-lg p-4 mb-4">
          <p class="text-pos-text mb-2">
            <strong>Important :</strong> À partir du 1er septembre 2026, tous les logiciels de caisse
            en France doivent être certifiés NF525 par l'AFNOR ou le LNE.
          </p>
          <p class="text-gray-400 text-sm">
            Cette version de démonstration n'est pas certifiée. Pour une utilisation commerciale,
            veuillez contacter un organisme de certification.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="bg-pos-accent p-3 rounded-lg">
            <p class="text-gray-400">Inaltérabilité</p>
            <p class="text-pos-success font-medium">✓ Données horodatées</p>
          </div>
          <div class="bg-pos-accent p-3 rounded-lg">
            <p class="text-gray-400">Sécurisation</p>
            <p class="text-pos-warning font-medium">⚠ Chiffrement à implémenter</p>
          </div>
          <div class="bg-pos-accent p-3 rounded-lg">
            <p class="text-gray-400">Conservation</p>
            <p class="text-pos-success font-medium">✓ Historique conservé</p>
          </div>
          <div class="bg-pos-accent p-3 rounded-lg">
            <p class="text-gray-400">Archivage</p>
            <p class="text-pos-success font-medium">✓ Export disponible</p>
          </div>
        </div>
      </div>

      <!-- Bouton de sauvegarde -->
      <div class="flex justify-end">
        <button
          class="px-8 py-3 bg-pos-success text-pos-dark rounded-xl font-bold text-lg hover:bg-green-400 transition-colors"
          on:click={saveSettings}
        >
          💾 Enregistrer les paramètres
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .settings-card {
    background: var(--pos-darker);
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid var(--pos-accent);
  }
</style>
