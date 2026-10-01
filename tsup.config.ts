import path from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "plugin/src/index.ts",
    global: "plugin/src/global.ts",
  },
  outDir: "dist/plugin",
  format: ["cjs"],
  target: "es2020",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  esbuildOptions(options) {
    options.alias = {
      "@shared": path.resolve(__dirname, "./shared"),
    };
  },
  outExtension() {
    return {
      js: ".js",
    };
  },
});
