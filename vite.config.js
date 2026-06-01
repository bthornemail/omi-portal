import { resolve } from "node:path";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vite";

const PUBLIC_HTML_ENTRYPOINTS = ["aframe.html", "document.html", "bidi.html", "portal.html"];

export default defineConfig({
  plugins: [
    {
      name: "hoist-public-html-entrypoints",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const pathname = req.url?.split("?")[0]?.replace(/^\//, "");
          if (!PUBLIC_HTML_ENTRYPOINTS.includes(pathname)) {
            next();
            return;
          }

          const sourcePath = resolve(__dirname, "public", pathname);
          if (!existsSync(sourcePath)) {
            next();
            return;
          }

          try {
            const html = readFileSync(sourcePath, "utf8");
            const transformed = await server.transformIndexHtml(`/${pathname}`, html);
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(transformed);
          } catch (error) {
            next(error);
          }
        });
      },
      closeBundle() {
        for (const file of PUBLIC_HTML_ENTRYPOINTS) {
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
        bidi: resolve(__dirname, "public/bidi.html"),
        portal: resolve(__dirname, "public/portal.html")
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
