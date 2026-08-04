/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Named type scale from the dashboard design plan - nothing below
      // 11px anywhere in the app. Prefer these over ad hoc text-[Npx]
      // values so new code converges on one scale instead of picking a
      // new size each time. Existing text-[11px]/text-xs usage is fine
      // as-is; these are additive, not a breaking rename.
      fontSize: {
        caption: ['11px', { lineHeight: '1.4' }],
        body: ['14px', { lineHeight: '1.5' }],
        'card-title': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'page-title': ['20px', { lineHeight: '1.3', fontWeight: '700' }],
        kpi: ['28px', { lineHeight: '1.2', fontWeight: '700' }]
      },
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
