<script lang="ts">
  import { productsStore } from '$lib/stores/products';
  import { categories, getCategoryColor } from '$lib/data/categories';
  import type { Product, CategoryType, VatRate } from '$lib/types';

  let showAddModal = false;
  let editingProduct: Product | null = null;
  let searchQuery = '';
  let filterCategory: CategoryType | 'all' = 'all';

  // Formulaire
  let formData = {
    name: '',
    price: '',
    category: 'repas' as CategoryType,
    vatRate: 2.1 as VatRate,
    stock: '',
    minStock: '',
    isActive: true
  };

  function formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' €';
  }

  function resetForm() {
    formData = {
      name: '',
      price: '',
      category: 'repas',
      vatRate: 2.1,
      stock: '',
      minStock: '',
      isActive: true
    };
    editingProduct = null;
  }

  function openAddModal() {
    resetForm();
    showAddModal = true;
  }

  function openEditModal(product: Product) {
    editingProduct = product;
    formData = {
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      vatRate: product.vatRate,
      stock: product.stock?.toString() || '',
      minStock: product.minStock?.toString() || '',
      isActive: product.isActive
    };
    showAddModal = true;
  }

  function closeModal() {
    showAddModal = false;
    resetForm();
  }

  function saveProduct() {
    const price = parseFloat(formData.price.replace(',', '.'));
    const stock = formData.stock ? parseInt(formData.stock) : undefined;
    const minStock = formData.minStock ? parseInt(formData.minStock) : undefined;

    if (!formData.name || isNaN(price)) {
      alert('Veuillez remplir le nom et le prix');
      return;
    }

    const productData = {
      name: formData.name,
      price,
      category: formData.category,
      vatRate: formData.vatRate,
      stock,
      minStock,
      isActive: formData.isActive
    };

    if (editingProduct) {
      productsStore.update(editingProduct.id, productData);
    } else {
      productsStore.add(productData);
    }

    closeModal();
  }

  function deleteProduct(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      productsStore.delete(id);
    }
  }

  function toggleActive(id: string) {
    productsStore.toggleActive(id);
  }

  function getCategoryName(categoryId: CategoryType): string {
    return categories.find(c => c.id === categoryId)?.name || categoryId;
  }

  function resetProducts() {
    if (confirm('Réinitialiser tous les produits avec les valeurs par défaut ?')) {
      productsStore.reset();
    }
  }

  // Filtrage
  $: filteredProducts = $productsStore.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });
</script>

<svelte:head>
  <title>Produits - POS System</title>
</svelte:head>

<div class="h-full overflow-y-auto p-6">
  <div class="max-w-6xl mx-auto">
    <!-- En-tête -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-pos-text">Gestion des Produits</h1>
        <p class="text-gray-400">{$productsStore.length} produits</p>
      </div>
      <div class="flex gap-3">
        <button
          class="px-4 py-2 bg-pos-accent text-pos-text rounded-lg hover:bg-pos-primary transition-colors"
          on:click={resetProducts}
        >
          🔄 Réinitialiser
        </button>
        <button
          class="px-4 py-2 bg-pos-success text-pos-dark rounded-lg hover:bg-green-400 transition-colors font-medium"
          on:click={openAddModal}
        >
          ➕ Ajouter un produit
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="flex gap-4 mb-6">
      <div class="flex-1">
        <input
          type="text"
          placeholder="🔍 Rechercher un produit..."
          bind:value={searchQuery}
          class="w-full px-4 py-3 bg-pos-darker text-pos-text rounded-xl border border-pos-accent focus:border-pos-primary focus:outline-none"
        />
      </div>
      <select
        bind:value={filterCategory}
        class="px-4 py-3 bg-pos-darker text-pos-text rounded-xl border border-pos-accent focus:border-pos-primary focus:outline-none"
      >
        <option value="all">Toutes les catégories</option>
        {#each categories as category}
          <option value={category.id}>{category.icon} {category.name}</option>
        {/each}
      </select>
    </div>

    <!-- Liste des produits -->
    <div class="bg-pos-darker rounded-xl border border-pos-accent overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-pos-accent">
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-400">Produit</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-400">Catégorie</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-400">Prix</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-400">TVA</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-400">Stock</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-400">Statut</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredProducts as product (product.id)}
            <tr class="border-b border-pos-accent/50 hover:bg-pos-accent/30 transition-colors">
              <td class="px-4 py-3">
                <span class="font-medium text-pos-text">{product.name}</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-1 rounded text-xs font-medium text-white"
                  style="background-color: {getCategoryColor(product.category)}"
                >
                  {getCategoryName(product.category)}
                </span>
              </td>
              <td class="px-4 py-3 text-right font-bold text-pos-text">
                {formatPrice(product.price)}
              </td>
              <td class="px-4 py-3 text-center text-gray-400">
                {product.vatRate}%
              </td>
              <td class="px-4 py-3 text-center">
                {#if product.stock !== undefined}
                  <span class="{product.stock <= (product.minStock || 0) ? 'text-pos-danger' : 'text-pos-text'}">
                    {product.stock}
                  </span>
                  {#if product.minStock}
                    <span class="text-gray-500 text-xs">/ min {product.minStock}</span>
                  {/if}
                {:else}
                  <span class="text-gray-500">-</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  class="px-2 py-1 rounded text-xs font-medium transition-colors"
                  class:bg-pos-success={product.isActive}
                  class:text-pos-dark={product.isActive}
                  class:bg-gray-600={!product.isActive}
                  class:text-gray-300={!product.isActive}
                  on:click={() => toggleActive(product.id)}
                >
                  {product.isActive ? 'Actif' : 'Inactif'}
                </button>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    class="p-2 text-pos-info hover:bg-pos-info/20 rounded-lg transition-colors"
                    title="Modifier"
                    on:click={() => openEditModal(product)}
                  >
                    ✏️
                  </button>
                  <button
                    class="p-2 text-pos-danger hover:bg-pos-danger/20 rounded-lg transition-colors"
                    title="Supprimer"
                    on:click={() => deleteProduct(product.id)}
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if filteredProducts.length === 0}
        <div class="p-8 text-center text-gray-400">
          <span class="text-4xl block mb-2">📦</span>
          Aucun produit trouvé
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Modal Ajout/Edition -->
{#if showAddModal}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    on:click={closeModal}
    on:keydown={(e) => e.key === 'Escape' && closeModal()}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="bg-pos-darker rounded-2xl w-full max-w-md shadow-2xl"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-pos-accent">
        <h2 class="text-xl font-bold text-pos-text">
          {editingProduct ? '✏️ Modifier le produit' : '➕ Nouveau produit'}
        </h2>
        <button
          class="w-8 h-8 rounded-full bg-pos-accent text-pos-text flex items-center justify-center text-xl hover:bg-pos-primary transition-colors"
          on:click={closeModal}
        >
          ×
        </button>
      </div>

      <!-- Formulaire -->
      <form class="p-4 space-y-4" on:submit|preventDefault={saveProduct}>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Nom du produit *</label>
          <input
            type="text"
            bind:value={formData.name}
            class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
            required
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Prix (€) *</label>
            <input
              type="text"
              bind:value={formData.price}
              placeholder="0,00"
              class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">TVA</label>
            <select
              bind:value={formData.vatRate}
              class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
            >
              <option value={2.1}>2,1% (taux réduit - alimentation)</option>
              <option value={8.5}>8,5% (taux normal - alcool)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1">Catégorie</label>
          <select
            bind:value={formData.category}
            class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
          >
            {#each categories as category}
              <option value={category.id}>{category.icon} {category.name}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Stock actuel</label>
            <input
              type="number"
              bind:value={formData.stock}
              placeholder="Optionnel"
              class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
              min="0"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Stock minimum</label>
            <input
              type="number"
              bind:value={formData.minStock}
              placeholder="Alerte"
              class="w-full px-4 py-2 bg-pos-accent text-pos-text rounded-lg focus:outline-none focus:ring-2 focus:ring-pos-primary"
              min="0"
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            bind:checked={formData.isActive}
            class="w-5 h-5 rounded bg-pos-accent border-pos-accent text-pos-primary focus:ring-pos-primary"
          />
          <label for="isActive" class="text-pos-text">Produit actif (visible en caisse)</label>
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
            {editingProduct ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
