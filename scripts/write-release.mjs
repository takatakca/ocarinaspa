import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const revision = process.env.SOURCE_COMMIT ?? process.env.GITHUB_SHA
  ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-fA-F0-9]{40}$/.test(revision)) {
  throw new Error('A valid full source commit is required for the release manifest.');
}
// Nitro inventories public files during compilation; generate this before Vite.
await writeFile('public/ocarina-release.json', JSON.stringify({ revision: revision.toLowerCase() }) + '\n');
