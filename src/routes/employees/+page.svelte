<script lang="ts">
  import { usersStore, currentPermissions } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import type { User, UserRole } from '$lib/types';

  // Vérifier les permissions
  $: if ($currentPermissions && !$currentPermissions.canAccessEmployees) {
    goto('/');
  }

  let showAddModal = false;
  let editingUser: User | null = null;

  let formData = {
    name: '',
    pin: '',
    role: 'employee' as UserRole,
    isActive: true
  };

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

  function resetForm() {
    formData = {
      name: '',
      pin: '',
      role: 'employee',
      isActive: true
    };
    editingUser = null;
  }

  function openAddModal() {
    resetForm();
    showAddModal = true;
  }

  function openEditModal(user: User) {
    editingUser = user;
    formData = {
      name: user.name,
      pin: user.pin,
      role: user.role,
      isActive: user.isActive
    };
    showAddModal = true;
  }

  function closeModal() {
    showAddModal = false;
    resetForm();
  }

  function saveUser() {
    if (!formData.name || !formData.pin) {
      alert('Veuillez remplir le nom et le code PIN');
      return;
    }

    if (formData.pin.length !== 4 || !/^\d+$/.test(formData.pin)) {
      alert('Le code PIN doit contenir 4 chiffres');
      return;
    }

    // Vérifier que le PIN n'est pas déjà utilisé
    const existingUser = $usersStore.find(u => u.pin === formData.pin && u.id !== editingUser?.id);
    if (existingUser) {
      alert('Ce code PIN est déjà utilisé par ' + existingUser.name);
      return;
    }

    if (editingUser) {
      usersStore.update(editingUser.id, formData);
    } else {
      usersStore.add(formData);
    }

    closeModal();
  }

  function deleteUser(id: string) {
    const user = $usersStore.find(u => u.id === id);
    if (user?.role === 'owner') {
      alert('Impossible de supprimer le compte patron');
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      usersStore.delete(id);
    }
  }

  function toggleActive(id: string) {
    const user = $usersStore.find(u => u.id === id);
    if (user?.role === 'owner') {
      alert('Impossible de désactiver le compte patron');
      return;
    }
    usersStore.toggleActive(id);
  }
</script>

<svelte:head>
  <title>Personnel - POS System</title>
</svelte:head>

<div class="h-full overflow-y-auto p-6">
  <div class="max-w-4xl mx-auto">
    <!-- En-tête -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-pos-text">Gestion du Personnel</h1>
        <p class="text-gray-400">{$usersStore.length} utilisateurs</p>
      </div>
      <button
        class="px-4 py-2 bg-pos-success text-pos-dark rounded-lg hover:bg-green-400 transition-colors font-medium"
        on:click={openAddModal}
      >
        ➕ Ajouter un utilisateur
      </button>
    </div>

    <!-- Liste des utilisateurs -->
    <div class="space-y-4">
      {#each $usersStore as user (user.id)}
        <div class="bg-pos-darker rounded-xl p-4 border border-pos-accent flex items-center gap-4">
          <!-- Avatar -->
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style="background-color: {getRoleColor(user.role)}20"
          >
            👤
          </div>

          <!-- Info -->
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <p class="font-bold text-pos-text">{user.name}</p>
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                style="background-color: {getRoleColor(user.role)}30; color: {getRoleColor(user.role)}"
              >
                {getRoleLabel(user.role)}
              </span>
              {#if !user.isActive}
                <span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-600 text-gray-300">
                  Inactif
                </span>
              {/if}
            </div>
            <p class="text-sm text-gray-400">PIN: ****</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-2 rounded-lg text-sm transition-colors
                     {user.isActive ? 'bg-pos-success/20 text-pos-success' : 'bg-gray-600/20 text-gray-400'}"
              on:click={() => toggleActive(user.id)}
              disabled={user.role === 'owner'}
            >
              {user.isActive ? '✓ Actif' : '○ Inactif'}
            </button>
            <button
              class="p-2 text-pos-info hover:bg-pos-info/20 rounded-lg transition-colors"
              title="Modifier"
              on:click={() => openEditModal(user)}
            >
              ✏️
            </button>
            <button
              class="p-2 text-pos-danger hover:bg-pos-danger/20 rounded-lg transition-colors"
              title="Supprimer"
              on:click={() => deleteUser(user.id)}
              disabled={user.role === 'owner'}
            >
              🗑️
            </button>
          </div>
        </div>
      {/each}
    </div>

    <!-- Légende des rôles -->
    <div class="mt-8 bg-pos-darker rounded-xl p-4 border border-pos-accent">
      <h3 class="font-bold text-pos-text mb-3">Permissions par rôle</h3>
      <div class="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p class="font-medium" style="color: #4ade80">👑 Patron</p>
          <ul class="text-gray-400 mt-1 space-y-1">
            <li>✓ Accès caisse</li>
            <li>✓ Dashboard & Analytics</li>
            <li>✓ Gestion produits</li>
            <li>✓ Gestion personnel</li>
            <li>✓ Paramètres</li>
            <li>✓ Suivi à distance</li>
          </ul>
        </div>
        <div>
          <p class="font-medium" style="color: #3b82f6">📋 Secrétaire</p>
          <ul class="text-gray-400 mt-1 space-y-1">
            <li>✓ Accès caisse</li>
            <li>✓ Dashboard & Analytics</li>
            <li>✓ Gestion produits</li>
            <li>✗ Gestion personnel</li>
            <li>✗ Paramètres</li>
            <li>✓ Suivi à distance</li>
          </ul>
        </div>
        <div>
          <p class="font-medium" style="color: #fbbf24">👷 Employé</p>
          <ul class="text-gray-400 mt-1 space-y-1">
            <li>✓ Accès caisse</li>
            <li>✗ Dashboard & Analytics</li>
            <li>✗ Gestion produits</li>
            <li>✗ Gestion personnel</li>
            <li>✗ Paramètres</li>
            <li>✗ Suivi à distance</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Modal Ajout/Edition -->
{#if showAddModal}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    role="dialog"
    aria-modal="true"
  >
    <div class="bg-pos-darker rounded-2xl w-full max-w-md shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-pos-accent">
        <h2 class="text-xl font-bold text-pos-text">
          {editingUser ? '✏️ Modifier l\'utilisateur' : '➕ Nouvel utilisateur'}
        </h2>
        <button
          class="w-8 h-8 rounded-full bg-pos-accent text-pos-text flex items-center justify-center text-xl hover:bg-pos-primary transition-colors"
          on:click={closeModal}
        >
          ×
        </button>
      </div>

      <!-- Formulaire -->
      <form class="p-4 space-y-4" on:submit|preventDefault={saveUser}>
        <div>
          <label class="block text-sm text-gray-400 mb-1" for="userName">Nom *</label>
          <input
            id="userName"
            type="text"
            bind:value={formData.name}
            class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
            required
          />
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1" for="userPin">Code PIN (4 chiffres) *</label>
          <input
            id="userPin"
            type="text"
            bind:value={formData.pin}
            maxlength="4"
            pattern="[0-9]{4}"
            placeholder="0000"
            class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary font-mono text-xl tracking-widest"
            required
          />
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1" for="userRole">Rôle</label>
          <select
            id="userRole"
            bind:value={formData.role}
            class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
            disabled={editingUser?.role === 'owner'}
          >
            <option value="employee">👷 Employé</option>
            <option value="secretary">📋 Secrétaire</option>
            <option value="owner">👑 Patron</option>
          </select>
        </div>

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            bind:checked={formData.isActive}
            class="w-5 h-5 rounded bg-pos-accent border-pos-accent text-pos-primary focus:ring-pos-primary"
            disabled={editingUser?.role === 'owner'}
          />
          <label for="isActive" class="text-pos-text">Utilisateur actif</label>
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="button"
            class="flex-1 py-3 bg-pos-accent text-pos-text rounded-xl font-medium hover:bg-pos-dark transition-colors"
            on:click={closeModal}
          >
            Annuler
          </button>
          <button
            type="submit"
            class="flex-1 py-3 bg-pos-success text-pos-dark rounded-xl font-medium hover:bg-green-400 transition-colors"
          >
            {editingUser ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
