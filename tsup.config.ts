import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/delta.ts", "src/TilemapEditor.css"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  esbuildOptions: (options) => {
    options.jsx = "automatic";
    return options;
  },
});
