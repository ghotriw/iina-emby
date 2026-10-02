import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const info = JSON.parse(fs.readFileSync(new URL("./Info.json", import.meta.url), "utf-8"));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(info.version),
  },
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
    outDir: "dist/client",
    emptyOutDir: true,
  },
});
