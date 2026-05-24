import { readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const bucket = process.env.R2_BUCKET || 'spt-fyi-data';
const root = fileURLToPath(new URL('..', import.meta.url));
const dataDir = join(root, 'data');

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.csv', 'text/csv; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json'],
  ['.png', 'image/png'],
  ['.sqlite', 'application/vnd.sqlite3'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json'],
  ['.webp', 'image/webp'],
  ['.xml', 'application/xml'],
  ['.zip', 'application/zip'],
]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function cacheControlFor(key) {
  if (key === 'manifest.json') return 'public, max-age=300';
  return 'public, max-age=86400';
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with ${signal || code}`));
      }
    });
  });
}

const files = (await walk(dataDir)).sort();

if (files.length === 0) {
  console.log('No data files to upload.');
  process.exit(0);
}

for (const file of files) {
  const key = relative(dataDir, file).split(sep).join('/');
  const { size } = await stat(file);
  const contentType = contentTypes.get(extname(file).toLowerCase()) || 'application/octet-stream';
  const cacheControl = cacheControlFor(key);

  console.log(`Uploading data/${key} (${size} bytes) to r2://${bucket}/${key}`);
  await run('wrangler', [
    'r2',
    'object',
    'put',
    `${bucket}/${key}`,
    '--file',
    file,
    '--content-type',
    contentType,
    '--cache-control',
    cacheControl,
    '--remote',
  ]);
}
