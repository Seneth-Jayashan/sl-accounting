// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Based on the new Brand Guideline PDF
        "primary-blue": "#053A4E",        // Dark Blue (Secondary Color)
        "primary-cerulean": "#05668A",     // Prussian Blue (Primary)
        "secondary-alice": "#E8EFF7",      // Alice Blue (Secondary)
        "accent-asparagus": "#679436",     // Asparagus Green (Primary)
        "accent-coral": "#EF8D8E",         // Light Coral (Primary/Accent)
        "accent-yellow": "#FFE787",        // Yellow (Accent)
        "text-dark": "#02121E",           // Almost Black (Secondary)
      },
      fontFamily: {
        // We already set these up, they match the guide!
        heading: ["Apex Pura", "Poppins", "sans-serif"], //
        body: ["Sarasavi", "FM Basuru", "sans-serif"],    //
      },
    },
  },
  plugins: [],
};