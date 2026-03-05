import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: false, // Disable hot module replacement to prevent auto-refresh
    watch: {
      ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
      usePolling: false,
    },
    middlewareMode: false,
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

      console.log("✅ Express app created and ready to handle requests");

      // Middleware to handle API routes with Express
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";

        // Only let Express handle /api routes
        if (url.startsWith("/api")) {
          try {
            // Invoke Express app with proper next callback
            // This allows Express to complete the request/response cycle
            return app(req, res, (err?: any) => {
              // If Express middleware chain ends without handling, call Vite's next
              if (err) {
                console.error("❌ Express error:", err);
                if (!res.headersSent) {
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: "Internal Server Error" }));
                }
              } else if (!res.headersSent) {
                // No error but also no response sent - 404
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Not Found" }));
              }
            });
          } catch (error) {
            console.error("❌ Error in Express middleware for", url, ":", error);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Internal Server Error", details: String(error) }));
            }
          }
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
