import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "lucide-react", "date-fns"],
          components: ["./src/components"],
          pages: ["./src/pages"],
        },
      },
    },
    minify: "terser",
    sourcemap: true,
    chunkSizeWarningLimit: 500,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
});
