import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    allowedHosts: ["unyieldingly-chanceful-ann.ngrok-free.dev"],
    proxy: {
      "/apply": "https://decentrathon-production.up.railway.app",
      "/submit": "https://decentrathon-production.up.railway.app",
    },
  },
});
