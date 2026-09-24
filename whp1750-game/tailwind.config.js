/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1b1f2a',
        parchment: '#f6f1e7',
        brass: '#b08d57',
        rust: '#a4462b',
        forest: '#2f4a3c',
        navy: '#1f3350',
      },
      fontFamily: {
        serif: ['"Spectral"', '"Georgia"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

