// MochaHost / cPanel Node.js entry point.
// cPanel "Application Startup File" = server.js
// This delegates to the Nitro Node server emitted by `npm run build:node`.
//
// PORT and HOST are read from the environment by the Nitro node-server preset.
// MochaHost provides PORT automatically; HOST defaults to 0.0.0.0.
import "./.output/server/index.mjs";
