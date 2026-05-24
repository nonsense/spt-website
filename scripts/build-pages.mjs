import { cp, mkdir, readdir, rm } from 'node:fs/promises';
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

const entries = await readdir(root, { withFileTypes: true });

await Promise.all(
  entries
    .filter((entry) => {
      if (!entry.isFile()) return false;
      if (entry.name === 'package.json' || entry.name === 'package-lock.json') return false;
      if (deployableSpecialFiles.has(entry.name)) return true;
      return deployableExtensions.has(extname(entry.name).toLowerCase());
    })
    .map((entry) => cp(join(root, entry.name), join(dist, entry.name)))
);

console.log('Built Cloudflare Pages assets in dist/');
