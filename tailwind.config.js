/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        branco: '#F1F5FA',
        amarelo: '#E1BF00',
        'cinza-base': '#373737',
        'preto-v1': '#000000',
        'preto-v2': '#0A0A0A',
        'preto-v3': '#1A1A1A',
        'cinza-botao': '#2C2C2C',
      },
      fontFamily: {
        barlow: ['Barlow', 'sans-serif'],
        'barlow-condensed': ['"Barlow Condensed"', 'sans-serif'],
        'barlow-semi-condensed': ['"Barlow Semi Condensed"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
