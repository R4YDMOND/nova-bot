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
      },
      borderRadius: {
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
