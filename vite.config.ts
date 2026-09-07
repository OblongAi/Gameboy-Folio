import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const spaPaths = new Set(["/privacy", "/cookies"]);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "legal-spa-fallback",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const path = req.url?.split("?")[0];
          if (path && spaPaths.has(path)) req.url = "/";
          next();
        });
      },
    },
  ],
});
