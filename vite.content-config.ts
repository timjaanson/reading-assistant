import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/chrome-extension/content/index.ts"),
        "content-main": resolve(
          __dirname,
          "src/chrome-extension/content/content.tsx"
        ),
      },
      output: {
        entryFileNames: "assets/[name].js",
      },
    },
  },
});
