# Pelagos game QR

Current destination: https://creepeevil.github.io/pelagos-mystery-game/

Run from the project root:

```powershell
npm.cmd run qr -- https://creepeevil.github.io/pelagos-mystery-game/
```

The script verifies the public game and representative assets before creating the QR.

Expected files: `pelagos-game-qr.png` (1200 × 1200 pixels), `pelagos-game-qr.svg`.
Both encode only the game homepage, with error correction H and a four-module white margin.
Scan the final PNG on a phone before printing.

In other shells, `npm run qr -- https://creepeevil.github.io/pelagos-mystery-game/` also works. Using `npm.cmd` on Windows avoids PowerShell execution-policy errors.

When the custom domain is ready, regenerate with `npm.cmd run qr -- https://ailakecapmattrang.com/`.
This overwrites both files with the new destination. Already printed QR codes continue pointing to the old URL.
