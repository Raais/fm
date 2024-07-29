import { defineConfig } from "vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [nodePolyfills(),tsconfigPaths(),react()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    host: "0.0.0.0",
  },
  base: '/fm/',
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
  build: {
    commonjsOptions: { transformMixedEsModules: true },
  }
});
