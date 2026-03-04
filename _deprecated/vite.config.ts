import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import * as pathTauri from "@tauri-apps/api/path";
import fs from "fs";
import beforeVite from "./vite.before";

// @ts-ignore process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-ignore process is a nodejs global
const isDev = process.env.TAURI_ENV == "development";
const isMinify = (!isDev ? 'esbuild' : false) as boolean | 'terser' | 'esbuild';



// https://vitejs.dev/config/
export default defineConfig(async () => {
  // 在开发和构建前同步版本号
  await beforeVite();

  return {
    base: './',
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: tag => tag.startsWith('s-')
          }
        }
      })
    ],
    resolve: {
      alias: {
        '@locals': path.resolve(__dirname, "./src-tauri/resources/locals"),
        '@/components': path.resolve(__dirname, "./src/components"),
        "@": path.resolve(__dirname, "./src"),
        "@assets": path.resolve(__dirname, "./src/assets"),
      },
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
      host: host || false,
      hmr: host
        ? {
          protocol: "ws",
          host,
          port: 1421,
        }
        : undefined,
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
      // proxy: {
      //   "/api": {
      //     target: "http://localhost:1420",
      //     changeOrigin: true,
      //     rewrite: (path) => path.replace(/^\/api/, ""),
      //   },
      // }
    },
    envPrefix: ["VITE_", "TAURI_"],
    build: {
      target: "esnext",
      minify: isMinify,
      sourcemap: isDev,
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
        },
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
              return 'assets/[name].[ext]'; // 保持文件名不变
            }
            return 'assets/[name]-[hash].[ext]';
          },
        },
      },
    },
  };
});
