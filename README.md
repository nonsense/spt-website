# SPT — Simple Public Transit

A clean, single-page marketing website for the SPT mobile app — the public transport companion for Sofia, Bulgaria and Zürich, Switzerland.

## About SPT

SPT provides maps, routes, stops and departures for Sofia and Zürich. Sofia surface vehicles use realtime data; Zürich vehicles and Sofia metro positions are timetable estimates. Zürich includes S-Bahn/regional rail schedules, plus official ZVV line colours and matching route shapes where available. The website serves as a landing page, app showcase, and support hub.

Zürich requires app version 2.1.5 or later.

## Pages

- **index.html** — Landing page with hero, feature grid, screenshots, and App Store download link
- **support.html** — Support and contact page
- **privacy.html** — Privacy policy

## Design

Apple-style aesthetics with system font stack, dark mode support, and responsive layout.

## Assets

- `icon.png` — Original app icon (1024×1024, 2 MB, source only)
- `icon-256.png` — Web-optimized icon used in page headers (256×256, 136 KB)
- `icon-512.png` — Larger icon used in hero section (512×512, 516 KB)
- `apple-touch-icon.png` — iOS home screen icon (180×180, 132 KB)
- `favicon.ico` / `favicon-32.png` — Browser tab icons (multi-res, 8 KB)
- `screen1.png` through `screen5.png` — App screenshots used in the feature showcase

## Deployment

This site is configured for Cloudflare Pages at `https://spt.fyi`.

```bash
mise install --locked
mise run setup
mise run preview   # draft checkout -> https://draft.spt-fyi.pages.dev
mise run publish   # main or draft checkout -> https://spt.fyi
```

Both commands use the existing `spt-fyi` Pages project on Anton's personal
account (`a6ed391c3a4b8c1152513609be9c5281`). They reject another account,
the wrong checkout and uncommitted tracked changes. Preview always targets
`draft`; production always targets `main`. The build includes only tracked
website assets, never untracked files or `englang.json`.

`mise exec -- node scripts/deploy.mjs --preview --dry-run` checks the target
without building or uploading. The app reads these commands from committed
`englang.json`. Publishing backs up draft first, then deploys it; it does not
move Git `main`. Git state and a saved publish record are not live verification.

Useful scripts:

- `npm run build` — copies deployable static assets into `dist/`
- `npm run preview` — serves the Cloudflare Pages build locally
- `npm run deploy` — deploys only the Pages site
- `npm run deploy:site` — deploys only the Pages site
- `npm run deploy:data` — uploads non-hidden files in `data/` to R2, preserving paths relative to `data/`
- `npm run deploy:all` — uploads `data/` to the `spt-fyi-data` R2 bucket, then deploys the Pages site
- `npm run deploy:preview` — updates the fixed draft Pages alias from the draft checkout

The app's website actions never run `deploy:data` or `deploy:all`. R2 uploads
are a separate operation and need separate approval.

The `spt.fyi` custom domain should be attached to the `spt-fyi` Cloudflare Pages project in Cloudflare. The `data.spt.fyi` custom domain should be attached to the `spt-fyi-data` R2 bucket.
