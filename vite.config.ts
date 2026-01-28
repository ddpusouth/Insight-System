import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': 'http://64.227.128.174:5001',
      '/uploads': 'http://64.227.128.174:5001',
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    {
      name: 'rewrite-routes',
      configureServer(server: any) {
        server.middlewares.use((req: any, res: any, next: any) => {
          const appRoutes = ['/dashboard', '/login', '/colleges', '/query', '/chat', '/infrastructure', '/settings', '/circular', '/ddpo-messages'];
          if (req.url && appRoutes.some((route: string) => req.url.startsWith(route))) {
            req.url = '/insight.html';
          }
          next();
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        insight: path.resolve(__dirname, 'insight.html'),
      },
    },
  },
}));
