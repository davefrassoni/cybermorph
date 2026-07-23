import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.CYBERMORPH_DESKTOP ? "./" : "/cybermorph/",
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022"
  }
});
