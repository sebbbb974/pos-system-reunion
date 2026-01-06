/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Palette moderne anti-fatigue oculaire
        'pos-dark': '#1a1a2e',
        'pos-darker': '#16213e',
        'pos-accent': '#0f3460',
        'pos-primary': '#e94560',
        'pos-text': '#eaeaea',
        'pos-success': '#4ade80',
        'pos-warning': '#fbbf24',
        'pos-danger': '#ef4444',
        'pos-info': '#3b82f6',
        // Catégories de produits
        'cat-repas': '#ef4444',
        'cat-boissons': '#3b82f6',
        'cat-desserts': '#f97316',
        'cat-sandwichs': '#eab308',
        'cat-glaces': '#06b6d4',
        'cat-formules': '#8b5cf6',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'touch': '1.125rem', // 18px pour tactile
        'touch-lg': '1.25rem', // 20px
      },
      spacing: {
        'touch': '3rem', // 48px minimum pour boutons tactiles
        'touch-lg': '4rem', // 64px
      },
      borderRadius: {
        'touch': '0.75rem',
      },
    },
  },
  plugins: [],
}
