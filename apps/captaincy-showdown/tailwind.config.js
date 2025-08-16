/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-coral': '#FF6A4D',
        'brand-green': '#02EBAE',
        'brand-dark': '#211F29',
        'brand-gold': '#F2C572',
        'brand-blue': '#1F4B59',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xl: '20px',
      },
    },
  },
  plugins: [],
}

