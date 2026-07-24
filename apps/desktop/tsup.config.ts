import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    main: "src/main.ts",
    preload: "src/preload.ts"
  },
  outDir: "dist-electron",
  format: ["cjs"],
  target: "node20",
  platform: "node",
  sourcemap: true,
  clean: true,
  external: ["electron", "electron-updater"],
  outExtension: () => ({ js: ".cjs" })
});
