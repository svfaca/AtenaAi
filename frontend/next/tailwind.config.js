/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./styles/**/*.css", "./node_modules/sonner/dist/*.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f4ff",
          100: "#e0e7ff",
          500: "#3b82f6",
          700: "#1d4ed8"
        }
      }
    }
  },
  plugins: []
};
