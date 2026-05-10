// MochaHost / cPanel Node.js entry point — Application Startup File: server.js
// Bridges Node http -> TanStack Start fetch handler, serves static client assets.
//
// Run with:  npm start
// Listens on process.env.PORT (provided by cPanel) — falls back to 3000.
import { serve } from "@hono/node-server";
import { createReadStream, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = join(__dirname, "dist", "client");
const serverEntryPath = join(__dirname, "dist", "server", "server.js");

const ssr = (await import(serverEntryPath)).default;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function tryServeStatic(pathname) {
  // Only handle paths that look like files (have an extension).
  if (!/\.[a-zA-Z0-9]+$/.test(pathname)) return null;
  const safe = normalize(pathname).replace(/^\/+/, "");
  if (safe.includes("..")) return null;
  const filePath = join(clientDir, safe);
  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    return null;
  }
  if (!stat.isFile()) return null;
  const ext = safe.slice(safe.lastIndexOf(".")).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const isHashed = /-[A-Za-z0-9_]{8,}\.[a-z0-9]+$/.test(safe);
  const cacheControl = isHashed
    ? "public, max-age=31536000, immutable"
    : "public, max-age=3600";
  return new Response(createReadStream(filePath), {
    status: 200,
    headers: {
      "content-type": type,
      "content-length": String(stat.size),
      "cache-control": cacheControl,
    },
  });
}

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

serve(
  {
    fetch: async (request) => {
      const url = new URL(request.url);
      const staticResponse = tryServeStatic(url.pathname);
      if (staticResponse) return staticResponse;
      return ssr.fetch(request);
    },
    port,
    hostname: host,
  },
  (info) => {
    console.log(`[ocarinaspa] Listening on http://${info.address}:${info.port}`);
  },
);
