// cPanel Passenger / local Node 22 startup bridge for the Nitro node-server preset.
// Run npm run build:node on CI; upload .output/ and this file to the host.
// Nitro binds to the PORT environment variable supplied by cPanel.
"use strict";
const { existsSync } = require("node:fs");
const { join } = require("node:path");
const entry = join(__dirname, ".output", "server", "index.mjs");
if (!existsSync(entry)) {
  console.error("[ocarinaspa] Missing Nitro build. Run npm run build:node and upload .output/.");
  process.exitCode = 1;
} else {
  import("./.output/server/index.mjs").catch((error) => {
    console.error("[ocarinaspa] Nitro startup failed:", error);
    process.exitCode = 1;
  });
}
