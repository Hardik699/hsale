import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  let app: any;

  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      app = createServer();

      // Middleware to handle API routes with Express
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";

        // Only let Express handle /api routes
        if (url.startsWith("/api")) {
          return app(req, res, next);
        }

        // All other routes go to Vite
        next();
      });

      // Return post hook for SPA fallback
      return () => {
        server.middlewares.use((req, res, next) => {
          const url = req.url || "";

          // Only handle GET requests
          if (req.method !== "GET") {
            return next();
          }

          // Skip if this is a static file or starts with /@
          if (/\.(js|jsx|ts|tsx|css|json|wasm|png|svg|jpg|jpeg|gif|ico|webp|html|map)(\?.*)?$/.test(url) || url.startsWith("/@")) {
            return next();
          }

          // Rewrite non-API routes to index.html for SPA routing
          if (!url.startsWith("/api")) {
            console.log(`🔄 SPA fallback: ${url} -> /index.html`);
            req.url = "/index.html";
          }
          next();
        });
      };
    },
  };
}
