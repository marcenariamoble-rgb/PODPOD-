#!/usr/bin/env node
/**
 * Smoke test HTTP: espera o servidor a correr (ex.: `npm run dev` ou `npm run start`).
 * Uso: node scripts/smoke.mjs [BASE_URL]
 *   BASE_URL default: http://127.0.0.1:3000
 */

const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);

const paths = [
  ["/", [200, 307, 308]],
  ["/login", [200]],
  ["/cardapio", [200]],
  ["/forgot-password", [200]],
];

async function check([path, okStatuses]) {
  const url = `${base}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  const ok = okStatuses.includes(res.status);
  return { path, url, status: res.status, ok };
}

async function main() {
  const results = [];
  for (const p of paths) {
    try {
      results.push(await check(p));
    } catch (e) {
      results.push({
        path: p[0],
        url: `${base}${p[0]}`,
        status: null,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    const extra = "error" in r && r.error ? ` (${r.error})` : "";
    console.log(
      r.ok ? "OK" : "FAIL",
      r.status != null ? r.status : "—",
      r.url + extra
    );
  }

  if (failed.length) {
    console.error(
      `\nSmoke falhou: ${failed.length}/${results.length}. O servidor está a correr em ${base}?`
    );
    process.exit(1);
  }
  console.log(`\nSmoke OK (${results.length} pedidos).`);
}

main();
