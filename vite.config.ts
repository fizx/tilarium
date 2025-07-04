import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "example",
  base: "/tilemapper/",
  build: {
    outDir: "../docs",
    rollupOptions: {
      output: {
        entryFileNames: `[name]-[hash].js`,
        chunkFileNames: `[name]-[hash].js`,
        assetFileNames: `[name]-[hash].[ext]`,
      },
    },
  },
});
