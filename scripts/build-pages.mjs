import { cp, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = fileURLToPath(new URL('../dist/', import.meta.url));

const deployableExtensions = new Set([
  '.css',
  '.gif',
  '.html',
  '.ico',
  '.jpg',
  '.jpeg',
  '.js',
  '.json',
  '.png',
  '.svg',
  '.txt',
  '.webmanifest',
  '.webp',
  '.xml',
]);
const deployableSpecialFiles = new Set(['_headers', '_redirects']);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

// Deploy only tracked, top-level website assets. Never upload local JSON,
// englang metadata, credentials, scripts or the separately managed data/ tree.
const entries = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
await Promise.all(entries.filter(name => {
  if (name.includes('/') || ['package.json', 'package-lock.json', 'englang.json'].includes(name)) return false;
  return deployableSpecialFiles.has(name) || deployableExtensions.has(extname(name).toLowerCase());
}).map(name => cp(join(root, name), join(dist, name))));

console.log('Built Cloudflare Pages assets in dist/');
