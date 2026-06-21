/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nova: {
          400: '#67e8f9',
          500: '#22d3ee',
          600: '#06b6d4',
        }
      }
    },
  },
  plugins: [],
}
