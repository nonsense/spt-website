import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
export const ACCOUNT = 'a6ed391c3a4b8c1152513609be9c5281';
// The website's one branch: `branch` in englang.json, `main` when absent.
export function websiteBranch(manifest) {
  const part = (manifest?.parts ?? []).find(item => item?.kind === 'website');
  return typeof part?.branch === 'string' && part.branch ? part.branch : 'main';
}

// Surfcode runs this in a deploy folder checked out at the commit on no branch, so
// the commit must be on the website's branch; the checkout's branch does not matter.
export function deployment({ preview, onBranch, account, dirty }) {
  if (account && account !== ACCOUNT) throw Error('Cloudflare account differs from the reviewed personal account');
  if (dirty) throw Error('Commit tracked changes before deployment. Untracked data is never uploaded.');
  if (!onBranch) throw Error("Only commits of the website's branch deploy");
  return { branch: preview ? 'draft' : 'main', project: 'spt-fyi', account: ACCOUNT };
}

function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--preview', '--dry-run'].includes(arg))) throw Error('Use --preview and/or --dry-run');
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const commit = git('rev-parse', 'HEAD');
  const source = websiteBranch(JSON.parse(fs.readFileSync(path.join(root, 'englang.json'), 'utf8')));
  const onBranch = spawnSync('git', ['merge-base', '--is-ancestor', commit, `refs/heads/${source}`], { cwd: root }).status === 0;
  const plan = deployment({ preview: args.includes('--preview'), onBranch,
    account: process.env.CLOUDFLARE_ACCOUNT_ID, dirty: git('status', '--porcelain', '--untracked-files=no') });
  const command = ['pages', 'deploy', 'dist', '--project-name', plan.project, '--branch', plan.branch,
    '--commit-hash', commit, '--commit-dirty=false'];
  console.log(JSON.stringify({ ...plan, commit, command }));
  if (args.includes('--dry-run')) return;
  execFileSync(process.execPath, ['scripts/build-pages.mjs'], { cwd: root, stdio: 'inherit' });
  if (git('rev-parse', 'HEAD') !== commit || git('status', '--porcelain', '--untracked-files=no')) {
    throw Error('Source changed during the build; nothing uploaded');
  }
  const cli = path.join(root, 'node_modules/wrangler/bin/wrangler.js');
  if (!fs.existsSync(cli)) throw Error('Run mise run setup first');
  const result = spawnSync(process.execPath, [cli, ...command], { cwd: root, stdio: 'inherit',
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT, WRANGLER_SEND_METRICS: 'false' } });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
