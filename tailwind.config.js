/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        kapal: {
          DEFAULT: '#3B82F6',
          dark: '#1D4ED8',
        },
        purchasing: {
          DEFAULT: '#10B981',
          dark: '#047857',
        },
        shared: {
          DEFAULT: '#8B5CF6',
          dark: '#6D28D9',
        },
        alert: {
          DEFAULT: '#EF4444',
          dark: '#B91C1C',
        },
        warning: {
          DEFAULT: '#F59E0B',
          dark: '#B45309',
        }
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom, 1.5rem)',
      }
    }
  },
  plugins: [],
}
