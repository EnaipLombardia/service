/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'enaip-green': '#006a4e',
        'enaip-brown': '#8b5a2b',
        'enaip-green-light': '#4a9a7e',
        'enaip-brown-light': '#c49a6c',
      },
    },
  },
  plugins: [],
};
