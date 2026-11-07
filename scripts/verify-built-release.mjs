import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';

const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const revision = (process.env.SOURCE_COMMIT ?? process.env.GITHUB_SHA
  ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()).toLowerCase();
const child = spawn(process.execPath, ['.output/server/index.mjs'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', (data) => { log = (log + data).slice(-10000); });
child.stderr.on('data', (data) => { log = (log + data).slice(-10000); });
try {
  let manifest;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Built server exited: ${log}`);
    try { manifest = await fetch(`http://127.0.0.1:${port}/ocarina-release.json`); break; }
    catch { await delay(100); }
  }
  assert(manifest, 'built server did not start');
  assert.equal(manifest.status, 200, 'release manifest must be publicly served');
  assert.equal(manifest.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await manifest.json(), { revision });
  const home = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(home.status, 200, 'homepage response');
  const html = await home.text();
  const notice = html.includes('id="migration-notice-title"');
  assert.equal(notice, process.env.VITE_TAKATAK_MIGRATION_NOTICE_HOME === 'true', 'notice activation must match the build flag');
  const services = await fetch(`http://127.0.0.1:${port}/services`);
  assert.equal(services.status, 200, 'services remain available');
  console.log(`PASS: built HTTP server, exact uncached revision, notice=${notice}, services 200`);
} finally {
  if (child.exitCode === null) {
    const stopped = new Promise((resolve) => child.once('exit', resolve));
    child.kill('SIGTERM');
    await Promise.race([stopped, delay(6000)]);
    if (child.exitCode === null) { child.kill('SIGKILL'); await stopped; }
  }
}
