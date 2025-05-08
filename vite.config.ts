import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path, { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        { src: "src/chrome-extension/manifest.json", dest: "." },
        { src: "src/chrome-extension/public/ra-16.png", dest: "./public" },
        { src: "src/chrome-extension/public/ra-32.png", dest: "./public" },
        { src: "src/chrome-extension/public/ra-48.png", dest: "./public" },
        { src: "src/chrome-extension/public/ra-192.png", dest: "./public" },
        { src: "public/cmaps", dest: "." },
        { src: "src/chrome-extension/pdf-redirect-rule.json", dest: "." },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "main.html"),
        "pdf-viewer": resolve(__dirname, "pdf-viewer.html"),
        background: resolve(
          __dirname,
          "src/chrome-extension/background/index.ts"
        ),
      },
      output: {
        entryFileNames: () => {
          return `[name].js`;
        },
      },
    },
  },
});
