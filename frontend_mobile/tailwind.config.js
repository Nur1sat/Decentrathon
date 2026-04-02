/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        surface: {
          100: "#0f0f13",
          200: "#17171d",
          300: "#1e1e27",
          400: "#2a2a38",
        },
      },
    },
  },
  plugins: [],
};
