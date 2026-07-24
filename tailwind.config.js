/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f3ff',
          100: '#e1e7ff',
          200: '#cbd4ff',
          305: '#b8c4ff',
          400: '#5c75ff',
          500: '#1d048a', // Brand base #1d048a
          600: '#150269',
          700: '#0f014f',
          800: '#0b013b',
          900: '#070026',
          950: '#040017'
        },
        indigo: {
          50: '#f0f3ff',
          100: '#e1e7ff',
          150: '#cbd4ff',
          200: '#b8c4ff',
          250: '#9facff',
          400: '#5c75ff',
          500: '#2b47ff',
          600: '#1d048a', // Overridden to match #1d048a base
          650: '#150269',
          700: '#0f014f',
          800: '#0b013b',
          950: '#040017'
        }
      }
    },
  },
  plugins: [],
}
