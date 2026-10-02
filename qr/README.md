Production QR files are deliberately generated only after the custom domain serves the game over HTTPS.

Run from the project root: `npm run qr -- https://ailakecapmattrang.com/`.

Expected files: `pelagos-game-qr.png` (1200 × 1200 pixels), `pelagos-game-qr.svg`.
Both encode only the production homepage, with error correction H and a four-module white margin.
Scan the final PNG on a phone before printing.
