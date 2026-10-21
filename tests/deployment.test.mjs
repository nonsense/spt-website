import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { deployment, ACCOUNT } from '../scripts/deploy.mjs';

test('draft and production use explicit, separate aliases on the personal account', () => {
  for (const preview of [true, false]) {
    const plan = deployment({ preview, branch: 'draft', dirty: '' });
    assert.deepEqual(plan, { branch: preview ? 'draft' : 'main', project: 'spt-fyi', account: ACCOUNT });
  }
});

test('wrong account, checkout and uncommitted source cannot deploy', () => {
  const valid = { preview: true, branch: 'draft', dirty: '' };
  for (const change of [{ account: 'other' }, { branch: 'main' }, { branch: 'feature' }, { dirty: ' M index.html' }]) {
    assert.throws(() => deployment({ ...valid, ...change }));
  }
  assert.throws(() => deployment({ ...valid, preview: false, branch: 'feature' }));
  assert.equal(deployment({ ...valid, preview: false, branch: 'main' }).branch, 'main');
});

test('build includes tracked assets, not metadata, local files or R2 data', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spt-assets-'));
  try {
    fs.mkdirSync(path.join(root, 'scripts'));
    fs.copyFileSync(new URL('../scripts/build-pages.mjs', import.meta.url), path.join(root, 'scripts/build-pages.mjs'));
    const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
    git('init', '-q');
    for (const name of ['index.html', 'style.css', 'englang.json', 'package.json', 'package-lock.json']) fs.writeFileSync(path.join(root, name), '{}');
    fs.mkdirSync(path.join(root, 'data')); fs.writeFileSync(path.join(root, 'data/manifest.json'), '{}');
    git('add', '.');
    fs.writeFileSync(path.join(root, 'private.json'), '{}');
    execFileSync(process.execPath, ['scripts/build-pages.mjs'], { cwd: root });
    assert.deepEqual(fs.readdirSync(path.join(root, 'dist')).sort(), ['index.html', 'style.css']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
