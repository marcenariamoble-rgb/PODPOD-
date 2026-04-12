import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function isNonEmptyFile(file: unknown): file is File {
  return typeof File !== "undefined" && file instanceof File && file.size > 0;
}

export type UploadProductPhotoResult =
  | { ok: true; url: string | null }
  | { ok: false; message: string };

/**
 * Envia foto de produto: Vercel Blob em produção (BLOB_READ_WRITE_TOKEN),
 * ou pasta `public/uploads/products` em desenvolvimento local.
 */
export async function uploadProductPhotoFromForm(
  file: unknown
): Promise<UploadProductPhotoResult> {
  if (!isNonEmptyFile(file)) {
    return { ok: true, url: null };
  }

  const mime = file.type;
  const ext = MIME_EXT[mime];
  if (!ext) {
    return {
      ok: false,
      message: "Formato inválido. Use JPG, PNG, WebP ou GIF.",
    };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "Imagem muito grande (máximo 5 MB)." };
  }

  const name = `p-${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${name}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return { ok: true, url: blob.url };
  }

  if (process.env.VERCEL === "1") {
    return {
      ok: false,
      message:
        "Armazenamento de imagens não configurado. Adicione BLOB_READ_WRITE_TOKEN no projeto (Vercel Blob).",
    };
  }

  const dir = join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, name), buf);
  return { ok: true, url: `/uploads/products/${name}` };
}
