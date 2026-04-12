/**
 * Configuração automática da base: Prisma + migrações + seed.
 * Pré-requisito: ficheiro .env na raiz com DATABASE_URL (ex.: Neon).
 *
 * Uso: npm run setup
 */
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

dotenv.config({ path: resolve(root, ".env") });
process.chdir(root);

if (!process.env.DATABASE_URL?.trim()) {
  console.error(`
[PodPod] Falta DATABASE_URL.

1. Copia .env.example para .env (se ainda não existir).
2. Cola a connection string do Neon em:
   DATABASE_URL="postgresql://..."

Depois corre de novo: npm run setup
`);
  process.exit(1);
}

function run(label, command) {
  console.log(`\n── ${label} ──\n`);
  execSync(command, { stdio: "inherit", shell: true, cwd: root });
}

console.log("\n[PodPod] A preparar a base de dados (automático)…\n");

run("Gerar cliente Prisma", "npx prisma generate");
run("Aplicar migrações (criar/atualizar tabelas)", "npx prisma migrate deploy");
run("Popular dados iniciais (utilizadores, produtos de exemplo)", "npx tsx prisma/seed.ts");

console.log(`
[PodPod] Concluído.

Próximo passo: npm run dev
Abre http://localhost:3000/login e entra com o utilizador Ronan (credenciais no log do seed acima).
`);
