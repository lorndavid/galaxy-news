/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bcd3ff",
          300: "#8eb5ff",
          400: "#598cff",
          500: "#3263fb",
          600: "#0d3fa9",
          700: "#0b356f",
          800: "#0b2a5c",
          900: "#0b1c39",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Khmer", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
