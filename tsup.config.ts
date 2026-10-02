import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "tsup";

const info = JSON.parse(fs.readFileSync(new URL("./Info.json", import.meta.url), "utf-8"));

export default defineConfig((options) => ({
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
  sourcemap: Boolean(options.watch),
  define: {
    __PLUGIN_VERSION__: JSON.stringify(info.version),
  },
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
}));
