// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: "#053A4E",
          cerulean: "#05668A",
          coral: "#EF8D8E",
          black: "#02121E",
        },
        secondary: {
          blue: "#82B3C5",
          alice: "#E8EFF7",
          tea: "#F7C6C7",
          rose: "#795056",
        },
        accent: {
          jasmine: "#FFE787",
        },
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
