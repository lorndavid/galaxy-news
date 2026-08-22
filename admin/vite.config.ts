import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";

/**
 * Injects a build-version timestamp into index.html so that browsers
 * always fetch the latest files after a new deployment.
 * The timestamp is appended as a query string to every <script> and
 * <link rel="stylesheet"> tag (e.g. ?v=1724332800).
 */
function htmlVersionPlugin(): Plugin {
  const VERSION = String(Math.floor(Date.now() / 1000));
  return {
    name: "html-version",
    transformIndexHtml(html) {
      const VERSION = String(Math.floor(Date.now() / 1000));
      return html
        .replace(/(src="\/[^"]*\.js)(")/g, `$1?v=${VERSION}$2`)
        .replace(/(href="\/[^"]*\.css)(")/g, `$1?v=${VERSION}$2`);
    },
  };
}

export default defineConfig({
  plugins: [vue(), htmlVersionPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },

    },
  },
});
