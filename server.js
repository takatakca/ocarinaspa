// MochaHost / cPanel Node.js entry point — Application Startup File: server.js
// Bridges Node http -> TanStack Start fetch handler, serves static client assets.
//
// Run with:  npm start
// Listens on process.env.PORT (provided by cPanel) — falls back to 3000.
import { serve } from "@hono/node-server";
import sirv from "sirv";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = join(__dirname, "dist", "client");
const serverEntryPath = join(__dirname, "dist", "server", "server.js");

const ssr = (await import(serverEntryPath)).default;

const staticHandler = sirv(clientDir, {
  etag: true,
  immutable: true,
  maxAge: 31536000,
  gzip: true,
  brotli: true,
  dev: false,
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

serve(
  {
    fetch: async (request) => {
      const url = new URL(request.url);
      // Try static asset first (only for paths that look like files).
      if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
        const staticResponse = await new Promise((resolve) => {
          const fakeReq = {
            url: url.pathname + url.search,
            method: request.method,
            headers: Object.fromEntries(request.headers),
          };
          let statusCode = 200;
          const headers = {};
          let body = null;
          const fakeRes = {
            statusCode: 200,
            setHeader(k, v) { headers[k.toLowerCase()] = v; },
            getHeader(k) { return headers[k.toLowerCase()]; },
            removeHeader(k) { delete headers[k.toLowerCase()]; },
            writeHead(code, hdrs) {
              statusCode = code;
              if (hdrs) for (const k of Object.keys(hdrs)) headers[k.toLowerCase()] = hdrs[k];
            },
            end(data) {
              statusCode = this.statusCode || statusCode;
              body = data ?? null;
              resolve(new Response(body, { status: statusCode, headers }));
            },
            on() {},
            once() {},
            emit() {},
          };
          staticHandler(fakeReq, fakeRes, () => resolve(null));
        });
        if (staticResponse) return staticResponse;
      }
      // Fall through to SSR / server routes.
      return ssr.fetch(request);
    },
    port,
    hostname: host,
  },
  (info) => {
    console.log(`[ocarinaspa] Listening on http://${info.address}:${info.port}`);
  },
);
