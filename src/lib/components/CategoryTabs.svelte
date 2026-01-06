<script lang="ts">
  import { categories } from '$lib/data/categories';
  import { selectedCategory } from '$lib/stores/products';
  import type { CategoryType } from '$lib/types';

  function selectCategory(category: CategoryType | 'all') {
    selectedCategory.set(category);
  }

  $: currentCategory = $selectedCategory;
</script>

<div class="flex gap-2 p-3 bg-pos-darker overflow-x-auto">
  <!-- Bouton Tous -->
  <button
    class="category-tab flex-shrink-0"
    class:active={currentCategory === 'all'}
    on:click={() => selectCategory('all')}
  >
    <span class="text-lg">📋</span>
    <span class="text-sm font-medium">Tous</span>
  </button>

  <!-- Catégories -->
  {#each categories as category}
    <button
      class="category-tab flex-shrink-0"
      class:active={currentCategory === category.id}
      style="--cat-color: {category.color}"
      on:click={() => selectCategory(category.id)}
    >
      <span class="text-lg">{category.icon}</span>
      <span class="text-sm font-medium">{category.name}</span>
    </button>
  {/each}
</div>

<style>
  .category-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background: var(--pos-accent);
    color: var(--pos-text);
    border: 2px solid transparent;
    transition: all 0.15s ease;
  }

  .category-tab:hover {
    background: var(--cat-color, var(--pos-accent));
    opacity: 0.9;
  }

  .category-tab.active {
    background: var(--cat-color, var(--pos-primary));
    border-color: var(--pos-text);
    transform: scale(1.02);
  }

  .category-tab:active {
    transform: scale(0.95);
  }
</style>
