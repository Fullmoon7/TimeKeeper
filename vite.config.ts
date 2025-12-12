import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import Info from "unplugin-info/vite";
import { defineConfig, type PluginOption } from "vite";
import { analyzer } from "vite-bundle-analyzer";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";

const shouldAnalyze = process.env.ANALYZE === "true";

const plugins: PluginOption[] = [
  Info(),
  react(),
  svgr(),
  tailwindcss(),
  VitePWA({
    strategies: "injectManifest",
    srcDir: "src",
    filename: "sw.ts",
    registerType: "autoUpdate",
    injectRegister: "auto",
    includeAssets: ["favicon.ico", "apple-touch-icon.png"],
    manifest: {
      name: "TimeKeeper - 时间管理",
      short_name: "TimeKeeper",
      description: "基于柳比歇夫时间管理法的时间记录应用",
      theme_color: "#ffffff",
      icons: [
        { src: "icon.png", sizes: "192x192", type: "image/png" },
        { src: "icon.png", sizes: "512x512", type: "image/png" },
      ],
    },
  }),
];

if (shouldAnalyze) {
  plugins.push(analyzer());
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": resolve("./src"),
    },
  },
  worker: {
    format: "es",
  },
});
