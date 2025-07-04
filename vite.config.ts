import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  root: "example",
  base: "/tilarium/",
  build: {
    outDir: "../docs",
    emptyOutDir: true,
  },
  plugins: [react()],
});
