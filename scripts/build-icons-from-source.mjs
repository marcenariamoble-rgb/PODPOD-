/**
 * Gera icon-192.png, icon-512.png, icon.png, favicon.png a partir do logo fonte.
 */
import { existsSync } from "node:fs";
import sharp from "sharp";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");

const localSource = join(root, "assets", "app-icon-source.png");
const cursorFallback = join(
  "C:",
  "Users",
  "ronan",
  ".cursor",
  "projects",
  "d-CURSOR-PODPOD",
  "assets",
  "c__Users_ronan_AppData_Roaming_Cursor_User_workspaceStorage_eee582161187136835fd7492de6bcfd4_images_icon-1bb2b92e-6930-4604-8d88-665a77545e7c.png"
);
const SOURCE =
  process.env.PODPOD_ICON_SOURCE ||
  (existsSync(localSource) ? localSource : cursorFallback);

async function main() {
  const img = sharp(SOURCE).ensureAlpha().png();

  await img.clone().resize(192, 192, { fit: "cover", position: "centre" }).png({ compressionLevel: 9 }).toFile(join(publicDir, "icon-192.png"));

  await img.clone().resize(512, 512, { fit: "cover", position: "centre" }).png({ compressionLevel: 9 }).toFile(join(publicDir, "icon-512.png"));

  await img.clone().resize(512, 512, { fit: "cover", position: "centre" }).png({ compressionLevel: 9 }).toFile(join(publicDir, "icon.png"));

  await img.clone().resize(32, 32, { fit: "cover", position: "centre" }).png({ compressionLevel: 9 }).toFile(join(publicDir, "favicon.png"));

  await img.clone().resize(180, 180, { fit: "cover", position: "centre" }).png({ compressionLevel: 9 }).toFile(join(publicDir, "apple-touch-icon.png"));

  const { default: pngToIco } = await import("png-to-ico");
  const { writeFileSync } = await import("node:fs");
  const icoBuf = await pngToIco([join(publicDir, "icon-192.png")]);
  writeFileSync(join(publicDir, "favicon.ico"), icoBuf);
  writeFileSync(join(root, "app", "favicon.ico"), icoBuf);

  console.log("OK: icon-192, icon-512, icon.png, favicon.png, apple-touch-icon, favicon.ico");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
