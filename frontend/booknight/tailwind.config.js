/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1B19',
        canvas: '#F7F5F0',
        graphite: {
          DEFAULT: '#23262B',
          soft: '#2E323A',
        },
        accent: {
          DEFAULT: '#3E6259',
          soft: '#C9D9C9',
        },
        line: '#D8D3C7',
        'line-dark': '#3A3E45',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Work Sans"', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};
