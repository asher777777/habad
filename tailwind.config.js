/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Note: Most configurations are now in src/app/globals.css using CSS variables for Tailwind v4
    },
  },
  plugins: [require("tailwindcss-animate")],
}
