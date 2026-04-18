/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        board: {
          light: '#f0d9b5',
          dark: '#b58863',
        },
        brand: {
          bg: '#1a1a2e',
          surface: '#16213e',
          panel: '#0f3460',
          accent: '#e94560',
          gold: '#f5a623',
        },
      },
    },
  },
  plugins: [],
}
