/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf4',
          100: '#d5f5e2',
          200: '#adeac8',
          300: '#77d9a5',
          400: '#43bf7f',
          500: '#229f63',
          600: '#177f4f',
          700: '#156540',
          800: '#155135',
          900: '#13432e'
        }
      }
    }
  },
  plugins: []
};
