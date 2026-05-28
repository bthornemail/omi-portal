import { resolve } from "node:path";
import { copyFileSync, existsSync } from "node:fs";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "hoist-public-html-entrypoints",
      closeBundle() {
        for (const file of ["aframe.html", "document.html", "bidi.html"]) {
          const processed = resolve(__dirname, "dist/public", file);
          if (existsSync(processed)) {
            copyFileSync(processed, resolve(__dirname, "dist", file));
          }
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        aframe: resolve(__dirname, "public/aframe.html"),
        document: resolve(__dirname, "public/document.html"),
        bidi: resolve(__dirname, "public/bidi.html")
      }
    }
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  }
});
