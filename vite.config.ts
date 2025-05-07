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
        popup: resolve(__dirname, "popup.html"),
        sidepanel: resolve(__dirname, "sidepanel.html"),
        options: resolve(__dirname, "options.html"),
        "pdf-viewer": resolve(__dirname, "pdf-viewer.html"),
        background: resolve(
          __dirname,
          "src/chrome-extension/background/index.ts"
        ),
        content: resolve(__dirname, "src/chrome-extension/content/index.ts"),
        "content-main": resolve(
          __dirname,
          "src/chrome-extension/content/content.tsx"
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
