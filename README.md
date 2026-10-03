# Pelagos Mystery Game

## Overview

PELAGOS — AI LÀ KẺ ĐÁNH CẮP MẶT TRĂNG? A static event card viewer and investigator's notebook built with HTML, CSS and vanilla JavaScript ES modules. Physical evidence and clues are supplied separately; the website contains no clue, hint or solution system.

## Features

- Three categories of four original cards; no category is selected at first load.
- Full original front/back artwork, keyboard-accessible 550 ms card flip.
- Three independent 4 × 4 deduction matrices, with an intentionally empty lower-right quadrant.
- Four cell states, one-to-one elimination, local device persistence and confirmed reset.
- Mobile horizontal notebook scrolling, 48 px touch cells, reduced motion support.
- No account, backend, tracking, camera or microphone access.

## Project Structure

```text
pelagos-mystery-game/
├── index.html
├── package.json / package-lock.json
├── README.md / CNAME / .nojekyll / .gitignore
├── css/style.css
├── js/
│   ├── data.js
│   ├── cards.js
│   ├── notebook.js
│   ├── storage.js
│   └── app.js
├── assets/
│   ├── manifest.json
│   ├── cards/{suspects,weapons,locations}/   (24 WebP files)
│   └── icons/{suspects,weapons,locations}/   (12 WebP files)
├── scripts/
│   ├── import-assets.py
│   └── generate-qr.mjs
├── tests/
│   ├── notebook.test.mjs
│   └── browser-check.mjs
└── qr/README.md
```

The project root in this workspace is `D:\Murdle`. Deployment assets use relative paths only.

## Card Assets

All 24 original pages were exported from the supplied `Watercolor Blue Minimalist Invitation Card  (6).pdf`, without cropping or rewriting. Each WebP is 1200 × 1698, quality 92. `assets/manifest.json` records page mapping and dimensions.

| Pages | Category | Card |
| --- | --- | --- |
| 1–2 | suspects | bernica |
| 3–4 | suspects | alyssa |
| 5–6 | suspects | glaucous |
| 7–8 | suspects | celadon |
| 9–10 | weapons | moon-key |
| 11–12 | weapons | metal-clamp |
| 13–14 | weapons | power-drill |
| 15–16 | weapons | repair-drone |
| 17–18 | locations | control-room |
| 19–20 | locations | old-library |
| 21–22 | locations | underground-tunnel |
| 23–24 | locations | observation-room |

First page of each pair is front; second is back. Names follow `{id}-front.webp` and `{id}-back.webp` in their category directory. Eight notebook icons are cropped from original front illustrations. Four are converted from the supplied drone, control panel, drill and tunnel JPGs. All icons are padded to 160 × 160 with no illustration distortion. White or paper backgrounds are retained to preserve artwork.

## Run Locally

Requires Node.js with npm. From the project root:

```sh
npm install
npm run serve
```

Open http://localhost:3000/ (or the address printed by serve if the port is occupied). Serve over HTTP; do not open the ES modules through `file://`.

## Game Data

`js/data.js` contains all 12 records, extracted directly from the supplied request, including descriptions, characteristics, paths and stable IDs. No puzzle or final outcome is stored.

## Card Flip

Select SUSPECTS, WEAPONS or LOCATIONS. Exactly four corresponding cards appear. Click or tap a card to turn it; click again to return. Keyboard Enter and Space work on focused cards. Artwork uses `object-fit: contain`. Category switches start the new group on its front faces.

## Investigator's Notebook

Every cell is a native button with full pair and current state in its accessible name. Top and side icons have full names in image alternatives and native title tooltips. The lower-right quadrant has no content.

## Notebook Matrices

1. `weapons-suspects`: weapon rows, suspect columns.
2. `weapons-locations`: weapon rows, location columns.
3. `locations-suspects`: location rows, suspect columns.

All 48 cells are generated from game data, not manually written in HTML.

## Cell States

Repeated taps cycle EMPTY → ✕ EXCLUDED → ? POSSIBLE → ✓ CONFIRMED → EMPTY. Marks are burgundy, amber and green respectively. Multiple ? marks may coexist and affect no neighbors.

## Auto Elimination

Only a newly placed ✓ excludes up to six other cells in its row and column, in the same matrix. Question marks are preserved when adding, replacing or clearing other ticks, including after a reload. A ? changes to ✓ only when the player taps that cell; resetting the case clears all marks. A new confirmation overrides old ✓ neighbors. No deductions cross between matrices. Clearing a ✓ removes its automatic ✕ marks, except where another ✓ still requires the exclusion. Manually placed ✕ marks are preserved. Replacing a confirmation also clears automatic exclusions that are no longer needed.

Test: tap Moon Key × Bernica three times. It becomes ✓, the three other suspects in the Moon Key row and the three other weapons in Bernica's column become ✕. The other two matrices remain untouched. Also try Power Drill × Control Room and Underground Tunnel × Glaucous in their respective matrices.

## LocalStorage

Key: `pelagos-deduction-grid-v1`. Example stable cell ID: `weapons-suspects:moon-key:bernica`. Reload the page after marking cells; marks and automatic exclusions remain. `_automaticExclusions` records automatically placed crosses so they can be removed after a refresh. Older saves lack that metadata, so crosses beside saved confirmations are treated as automatic when loaded. Progress is specific to the device, browser and origin; the GitHub Pages URL and custom domain have separate storage. Invalid JSON or invalid cell states are ignored. If storage is blocked or full, play continues in memory and the status tells the player saving failed.

## Reset Notebook

Click RESET NOTEBOOK. Cancel preserves all marks. Confirming “Xóa toàn bộ” clears all cells and removes only the notebook storage key. Cards and other localStorage data are unaffected.

## Responsive Design

Wide desktop displays show the card dossier beside the notebook. Smaller desktop/tablet layouts stack them. Mobile places header, categories, cards and notebook in that order. Cards use two columns, or one below 350 px. Notebook cells stay at least 48 px; only its region scrolls horizontally. Long names are truncated visually, with full accessible names.

## Generate QR

Current public game: https://creepeevil.github.io/pelagos-mystery-game/

```sh
npm.cmd run qr -- https://creepeevil.github.io/pelagos-mystery-game/
```

The script accepts the current GitHub Pages homepage or the planned custom domain and verifies the live game and representative assets before writing files. Outputs: `qr/pelagos-game-qr.png` (1200 × 1200) and `qr/pelagos-game-qr.svg`. Both encode only the selected homepage, with error correction H, a four-module margin, black foreground and white background. Scan the PNG with a real phone before printing. On Windows, `npm.cmd` avoids PowerShell execution-policy errors; `npm` works in other shells.

After custom-domain DNS and HTTPS are ready, run `npm.cmd run qr -- https://ailakecapmattrang.com/` to overwrite these files with QR codes for that domain. Already printed codes keep their original destination.

## GitHub Repository

Target: https://github.com/ngocannie/pelagos-mystery-game

Create this repository while signed into `ngocannie`, or grant write access to the account used for pushing. Then:

```sh
git init
git add .
git commit -m "Initial Pelagos mystery game"
git branch -M main
git remote add origin https://github.com/ngocannie/pelagos-mystery-game.git
git push -u origin main
```

If a remote already exists, use `git remote set-url origin ...`. `node_modules`, temporary renders and local environment files are ignored.

## Deploy GitHub Pages

Repository → Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → Folder: / (root) → Save. `.nojekyll` prevents unnecessary Jekyll processing. No build step is required.

Temporary URL: https://ngocannie.github.io/pelagos-mystery-game/

For the required temporary-URL test, keep the supplied `CNAME` locally but omit it from the first push, or remove it from the branch temporarily, and leave Custom domain unset. Once Pages passes its tests, commit `CNAME` and configure the domain. Otherwise Pages may redirect the temporary URL to a custom domain before DNS works.

## Custom Domain

Production: https://ailakecapmattrang.com/

In Settings → Pages → Custom domain enter `ailakecapmattrang.com` and Save. The root `CNAME` contains only that hostname. Verify domain ownership in the GitHub account's Pages settings when available.

## DNS

Checked against [official GitHub Pages documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) on 2026-10-02. Configure the custom domain in Pages before DNS. At the domain's DNS provider, use either an ALIAS/ANAME for `@` to `ngocannie.github.io`, or four A records:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Optional `www`: CNAME `www` → `ngocannie.github.io` (no repository path). Optional IPv6 AAAA values: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`. Remove conflicting records at these names. Recheck the linked documentation when deploying. DNS propagation may take up to 24 hours.

PowerShell checks:

```powershell
Resolve-DnsName ailakecapmattrang.com -Type A
Resolve-DnsName www.ailakecapmattrang.com -Type CNAME
```

## HTTPS

Wait for GitHub's domain check and certificate provisioning, then enable Enforce HTTPS in Pages. Open the production URL; verify no certificate warning or redirect loop, all cards/icons load, and the notebook works. Check on desktop and phone over both Wi-Fi and mobile data. Then generate the QR.

## Updating Cards

Keep file names stable, replace assets, and reload. To re-export from the original 24-page format:

```sh
python -m pip install pymupdf pillow
python scripts/import-assets.py "path/to/cards.pdf" --image-dir "path/to/original-jpgs"
```

Page order must match the table. Do not crop the full cards. Descriptive data changes belong in `js/data.js` and must agree with organizer-provided information.

## Updating Icons

Replace corresponding 160 × 160 WebP files in `assets/icons/`. Prefer original illustration crops without text. The import script uses the four supplied JPG filenames when present and falls back to a front illustration crop otherwise. It never invents illustrations.

## Mobile Testing

Test at 390 px, a smaller phone, tablet and desktop. Check category labels, readable front/back artwork, card flip, notebook swiping, taps, focus, marks after refresh, and reset cancel/confirm. At 390 px cards display in two columns; use “Xem thẻ lớn” to read the original backs in a full-width single column. Verify no body overflow and no missing images.

Run automated checks:

```sh
npm test
npx playwright install chromium
node tests/browser-check.mjs
```

The browser check expects the local server on port 3000. Screenshots and browser reports go under ignored `tmp/`.

Current deployment status: the game is public at https://creepeevil.github.io/pelagos-mystery-game/. QR PNG and SVG files encode this address. References to `ngocannie` above describe the original deployment plan; the current GitHub Pages owner is `creepeevil`. The planned custom domain has not been verified as part of this QR update.
