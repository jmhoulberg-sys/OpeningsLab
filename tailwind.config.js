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
          bg: '#2a2a2a',
          surface: '#323232',
          panel: '#222222',
          card: '#687289',
          accent: '#e94560',
          gold: '#f5a623',
        },
      },
    },
  },
  plugins: [],
}
