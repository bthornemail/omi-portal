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
    outDir: "dist",
    emptyOutDir: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
        pure_getters: true,
        passes: 3
      }
    },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        aframe: resolve(__dirname, "public/aframe.html"),
        document: resolve(__dirname, "public/document.html"),
        bidi: resolve(__dirname, "public/bidi.html")
      },
      output: {
        manualChunks(id) {
          if (id.includes("erasure") || id.includes("reed-solomon")) {
            return "graphics-erasure-engine";
          }
          if (id.includes("aframe") || id.includes("three")) {
            return "graphics-3d-pipeline";
          }
          if (id.includes("prolog") || id.includes("wordnet") || id.includes("hnsw") || id.includes("semantic-memory-broker")) {
            return "semantic-memory-broker";
          }
          if (id.includes("@codemirror") || id.includes("lezer")) {
            return "semantic-text-editor";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
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
