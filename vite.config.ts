import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  root: "example",
  base: "/kyle-maxwell/tilemapper/",
  publicDir: ".",
  outDir: "../docs",
});
