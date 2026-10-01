import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "./app"),
      "@shared": path.resolve(import.meta.dirname, "./shared"),
    },
  },
  plugins: [
    react(),
    viteSingleFile({
      removeViteModuleLoader: true,
    }),
  ],
  build: {
    outDir: "build/client",
    emptyOutDir: true,
  },
});
