/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#0a0f19',
          light: '#121a2a',
        },
      },
      fontFamily: {
        sans: ["'Segoe UI'", 'Tahoma', 'sans-serif'],
        arabic: ["'Traditional Arabic'", "'Segoe UI'", 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
