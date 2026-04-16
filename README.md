# PodPod

Aplicação Next.js para gestão de estoque, comodato e vendas (área administrativa e portal do vendedor).

## Desenvolvimento

```bash
npm install
cp .env.example .env
# Edite DATABASE_URL, DIRECT_URL (opcional) e AUTH_SECRET, depois:
npm run setup
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Veja `.env.example`. Em produção, `AUTH_SECRET` é obrigatório (o arranque falha sem ele — ver `instrumentation.ts`).

Opcional: `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` para erros no Sentry.

## Base de dados e migrações

- **Desenvolvimento:** `npm run db:migrate` (ou `db:push` se preferir push sem histórico).
- **Produção / CI:** `npm run db:deploy` (`prisma migrate deploy`).
- **Seed:** `npm run db:seed`.

No Prisma 7, a URL de migração fica em `prisma.config.ts`: usa `DIRECT_URL` quando definida e fallback para `DATABASE_URL`.

## Backup (PostgreSQL)

Antes de migrações destrutivas ou deploys grandes, faça dump da base (exemplo genérico):

```bash
pg_dump "$DATABASE_URL" -Fc -f backup.dump
```

Restauro: `pg_restore` conforme o vosso hosting.

## Smoke test HTTP

Com o servidor a correr (`npm run dev` ou `npm run start`):

```bash
npm run smoke
# ou
node scripts/smoke.mjs http://127.0.0.1:3000
```

## Deploy (Vercel)

1. Ligar repositório e definir variáveis (mesmas chaves que `.env.example`).
2. Build: `npm run build` (já inclui `prisma generate` no `postinstall`).
3. Após o primeiro deploy ou novas migrações: executar `prisma migrate deploy` no ambiente de produção (hook de deploy ou comando manual).

## Documentação Next.js

- [Next.js — Deploy](https://nextjs.org/docs/app/building-your-application/deploying)
