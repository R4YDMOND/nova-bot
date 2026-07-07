/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nova: {
          400: '#67e8f9',
          500: '#22d3ee',
          600: '#06b6d4',
        },
        primary: 'rgb(var(--primary) / <alpha-value>)',
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      fontSize: {
        display: ['48px', { lineHeight: '1.1', letterSpacing: '-0.015em', fontWeight: '700' }],
        h1: ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        h2: ['24px', { lineHeight: '1.25', letterSpacing: '-0.005em', fontWeight: '600' }],
        h3: ['20px', { lineHeight: '1.3', fontWeight: '500' }],
      },
      borderRadius: {
        '3xl': '1.25rem', // ваш существующий, используется в .card
        xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '32px',
      },
      maxWidth: { grid: '1440px' },
      boxShadow: {
        xs: '0px 1px 2px rgba(0,0,0,0.2)',
        sm: '0px 2px 4px rgba(0,0,0,0.25)',
        md: '0px 8px 16px rgba(0,0,0,0.3)',
        lg: '0px 16px 32px rgba(0,0,0,0.35)',
        xl: '0px 24px 64px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
};