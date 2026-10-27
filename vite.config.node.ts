// Production build config for the standalone Node.js server (Coolify; also runs under cPanel Passenger).
// vite.config.ts re-exports this file, so development and production share one configuration.
// Build with:  npm run build:node
// Output:      .output/server/index.mjs  (standalone Node server, listens on PORT)
// Start with:  npm start
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Force Nitro to emit a Node.js server bundle (no Cloudflare Workers).
process.env.NITRO_PRESET = process.env.NITRO_PRESET || "node-server";

export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    nitro(),
    react(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"],
  },
});
