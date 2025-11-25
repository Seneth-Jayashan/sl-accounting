/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          prussian: '#053A4E', // Text & Headings
          cerulean: '#05668A', // Primary Buttons
          coral: '#EF8D8E',    // Accents
          jasmine: '#FFE787',  // Highlights
          aliceBlue: '#E8EFF7', // Background
          white: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        sinhala: ['"Noto Sans Sinhala"', 'sans-serif'], // Ensure this font is imported in your CSS
      },
      animation: {
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}