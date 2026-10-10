import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist-splash",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        splash: resolve(__dirname, "splash.html"),
      },
    },
  },
  server: {
    port: 5173,
  },
});