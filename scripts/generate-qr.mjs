import QRCode from "qrcode";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const pagesUrl = "https://creepeevil.github.io/pelagos-mystery-game/";
const customDomainUrl = "https://ailakecapmattrang.com/";
const url = process.argv[2] ?? pagesUrl;
if (![pagesUrl, customDomainUrl].includes(url))
  throw new Error(`QR must point to ${pagesUrl} or ${customDomainUrl}`);
// Do not produce print assets until the deployed game is actually accessible.
const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
if (!response.ok || new URL(response.url).protocol !== "https:")
  throw new Error("The public game URL is not ready over HTTPS.");
const html = await response.text();
if (!html.includes("INVESTIGATOR'S NOTEBOOK") || !html.includes("js/app.js"))
  throw new Error("The public URL does not serve the Pelagos game.");
const root = new URL("../", import.meta.url);
for (const asset of ["js/app.js", "assets/cards/suspects/bernica-front.webp"]) {
  const check = await fetch(new URL(asset, url), {
    signal: AbortSignal.timeout(20000),
  });
  if (!check.ok) throw new Error(`Public game asset unavailable: ${asset}`);
}
const directory = new URL("qr/", root);
await mkdir(directory, { recursive: true });
const options = {
  errorCorrectionLevel: "H",
  margin: 4,
  width: 1200,
  color: { dark: "#000000", light: "#ffffff" },
};
await QRCode.toFile(
  fileURLToPath(new URL("pelagos-game-qr.png", directory)),
  url,
  options,
);
await writeFile(
  new URL("pelagos-game-qr.svg", directory),
  await QRCode.toString(url, { ...options, type: "svg" }),
);
console.log("Created qr/pelagos-game-qr.png and qr/pelagos-game-qr.svg");
console.log(`QR destination: ${url}`);
