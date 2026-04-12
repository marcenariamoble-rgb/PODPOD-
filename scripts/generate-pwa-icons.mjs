/**
 * Gera ícones PNG 192 e 512 a partir de um SVG embutido (roxo PodPod).
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "icons");

const svg = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c5ce7"/>
      <stop offset="100%" style="stop-color:#5539c9"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#g)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui,Segoe UI,sans-serif" font-weight="800"
    font-size="${Math.round(size * 0.42)}" fill="white">P</text>
</svg>`;

async function main() {
  const sharp = (await import("sharp")).default;
  await mkdir(outDir, { recursive: true });

  for (const px of [192, 512]) {
    const buf = Buffer.from(svg(px));
    const png = await sharp(buf).png({ compressionLevel: 9 }).toBuffer();
    const file = join(outDir, `icon-${px}.png`);
    await writeFile(file, png);
    console.log("Wrote", file);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
