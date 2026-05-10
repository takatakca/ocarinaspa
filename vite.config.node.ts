// Production build config for standard Node.js hosting (MochaHost / cPanel).
// This config is INDEPENDENT from vite.config.ts (Lovable preview).
// Build with:  npm run build:node
// Output:      .output/server/index.mjs  (standalone Node server, listens on PORT)
// Start with:  npm start
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Force Nitro to emit a Node.js server bundle (no Cloudflare Workers).
process.env.NITRO_PRESET = process.env.NITRO_PRESET || "node-server";

export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"],
  },
});
