/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        surface: {
          DEFAULT: "#09090f",
          100: "#09090f",
          200: "#111118",
          300: "#191922",
          400: "#22222e",
          500: "#2a2a38",
          600: "#33334a",
        },
        neon: {
          green: "#C1F11D",
          cyan: "#22d3ee",
          purple: "#a78bfa",
          red: "#ff4d6a",
          orange: "#ff9f43",
        },
        accent: {
          cyan:  "#22d3ee",
          teal:  "#2dd4bf",
          green: "#C1F11D",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
