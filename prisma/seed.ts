import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString =
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("Defina DIRECT_URL ou DATABASE_URL para executar o seed.");
}

const adapter = new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

/** Senhas padrão só para desenvolvimento — defina no .env em produção. */
const P = {
  ronan: process.env.SEED_RONAN_PASSWORD ?? "RonanPodPod2026!",
  operador: process.env.SEED_OPERADOR_PASSWORD ?? "OperadorPodPod2026!",
  vendedorJoao: process.env.SEED_VENDEDOR_JOAO_PASSWORD ?? "VendedorJoao2026!",
  vendedorMaria: process.env.SEED_VENDEDOR_MARIA_PASSWORD ?? "VendedorMaria2026!",
  vendedorRian: process.env.SEED_VENDEDOR_RIAN_PASSWORD ?? "VendedorRian2026!",
};

async function main() {
  const ronan = await prisma.user.upsert({
    where: { email: "ronan@podpod.local" },
    update: {
      nome: "Ronan",
      senhaHash: await bcrypt.hash(P.ronan, 10),
      role: "ADMIN",
      ativo: true,
    },
    create: {
      nome: "Ronan",
      email: "ronan@podpod.local",
      senhaHash: await bcrypt.hash(P.ronan, 10),
      role: "ADMIN",
      ativo: true,
    },
  });

  /** Conta legada — mantida para não quebrar quem já usava o seed antigo. */
  const adminLegado = await prisma.user.upsert({
    where: { email: "admin@podpod.local" },
    update: {
      senhaHash: await bcrypt.hash(P.ronan, 10),
      ativo: true,
    },
    create: {
      nome: "Administrador (legado)",
      email: "admin@podpod.local",
      senhaHash: await bcrypt.hash(P.ronan, 10),
      role: "ADMIN",
      ativo: true,
    },
  });

  const operador = await prisma.user.upsert({
    where: { email: "operador@podpod.local" },
    update: {
      senhaHash: await bcrypt.hash(P.operador, 10),
      ativo: true,
    },
    create: {
      nome: "Operador",
      email: "operador@podpod.local",
      senhaHash: await bcrypt.hash(P.operador, 10),
      role: "OPERADOR",
      ativo: true,
    },
  });

  const produtos = [
    {
      nome: "Pod Mint Ice",
      marca: "VapeLab",
      sabor: "Menta",
      categoria: "Pod descartável",
      sku: "POD-MINT-01",
      custoUnitario: 18.5,
      precoVendaSugerido: 35.9,
      estoqueCentral: 120,
      estoqueMinimo: 20,
    },
    {
      nome: "Pod Mango",
      marca: "VapeLab",
      sabor: "Manga",
      categoria: "Pod descartável",
      sku: "POD-MANGO-01",
      custoUnitario: 18.5,
      precoVendaSugerido: 35.9,
      estoqueCentral: 8,
      estoqueMinimo: 15,
    },
    {
      nome: "Pod Tobacco",
      marca: "SmokeCo",
      sabor: "Tabaco",
      categoria: "Pod descartável",
      sku: "POD-TOB-02",
      custoUnitario: 20,
      precoVendaSugerido: 39.9,
      estoqueCentral: 45,
      estoqueMinimo: 10,
    },
  ];

  for (const p of produtos) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        ...p,
        ativo: true,
      },
    });
  }

  const v1 = await prisma.seller.upsert({
    where: { id: "seed-seller-1" },
    update: {},
    create: {
      id: "seed-seller-1",
      nome: "João — Centro",
      telefone: "(11) 98888-1111",
      cidade: "São Paulo",
      regiao: "Centro",
      limiteComodato: 200,
      ativo: true,
    },
  });

  /** 2.º vendedor só de demonstração (não confundir com o Rian Silva real). */
  const v2 = await prisma.seller.upsert({
    where: { id: "seed-seller-2" },
    update: {
      nome: "Maria — Zona Sul",
      ativo: true,
    },
    create: {
      id: "seed-seller-2",
      nome: "Maria — Zona Sul",
      telefone: "(11) 97777-2222",
      cidade: "São Paulo",
      regiao: "Zona Sul",
      limiteComodato: 150,
      ativo: true,
    },
  });

  const ronanGeral = await prisma.seller.upsert({
    where: { id: "seed-estoque-geral" },
    update: {
      nome: "Ronan Nanuncio",
      ativo: true,
    },
    create: {
      id: "seed-estoque-geral",
      nome: "Ronan Nanuncio",
      regiao: "Estoque geral",
      limiteComodato: null,
      ativo: true,
      observacoes:
        "Detentor do depósito — as entradas no estoque central são atribuídas a este cadastro (PODPOD_ESTOQUE_GERAL_SELLER_ID).",
    },
  });

  const vendedorJoao = await prisma.user.upsert({
    where: { email: "vendedor@podpod.local" },
    update: {
      sellerId: v1.id,
      role: "VENDEDOR",
      senhaHash: await bcrypt.hash(P.vendedorJoao, 10),
      ativo: true,
    },
    create: {
      nome: "João — app vendedor",
      email: "vendedor@podpod.local",
      senhaHash: await bcrypt.hash(P.vendedorJoao, 10),
      role: "VENDEDOR",
      sellerId: v1.id,
      ativo: true,
    },
  });

  const vendedorMaria = await prisma.user.upsert({
    where: { email: "maria@podpod.local" },
    update: {
      sellerId: v2.id,
      role: "VENDEDOR",
      senhaHash: await bcrypt.hash(P.vendedorMaria, 10),
      ativo: true,
    },
    create: {
      nome: "Maria — app vendedor",
      email: "maria@podpod.local",
      senhaHash: await bcrypt.hash(P.vendedorMaria, 10),
      role: "VENDEDOR",
      sellerId: v2.id,
      ativo: true,
    },
  });

  /**
   * Rian Silva: um único login (rian@podpod.local) ligado ao vendedor já cadastrado.
   * 1) SEED_RIAN_SILVA_SELLER_ID no .env (id da URL /vendedores/[id]), ou
   * 2) procura um Seller com nome "RIAN SILVA" (ignora maiúsculas).
   * Não cria vendedor duplicado. Remove seed-seller-rian se existir e já não for necessário.
   */
  const envRianSellerId = process.env.SEED_RIAN_SILVA_SELLER_ID?.trim();
  let vendedorRianEmail: string | null = null;
  let rianSellerResolved: { id: string; nome: string } | null = null;

  if (envRianSellerId) {
    const s = await prisma.seller.findUnique({ where: { id: envRianSellerId } });
    if (!s) {
      throw new Error(
        `SEED_RIAN_SILVA_SELLER_ID=${envRianSellerId}: vendedor não encontrado. Copie o id em Vendedores.`
      );
    }
    rianSellerResolved = { id: s.id, nome: s.nome };
  } else {
    const s = await prisma.seller.findFirst({
      where: { nome: { equals: "RIAN SILVA", mode: "insensitive" } },
    });
    if (s) rianSellerResolved = { id: s.id, nome: s.nome };
  }

  if (rianSellerResolved) {
    const vr = await prisma.user.upsert({
      where: { email: "rian@podpod.local" },
      update: {
        nome: rianSellerResolved.nome,
        sellerId: rianSellerResolved.id,
        role: "VENDEDOR",
        senhaHash: await bcrypt.hash(P.vendedorRian, 10),
        ativo: true,
      },
      create: {
        nome: rianSellerResolved.nome,
        email: "rian@podpod.local",
        senhaHash: await bcrypt.hash(P.vendedorRian, 10),
        role: "VENDEDOR",
        sellerId: rianSellerResolved.id,
        ativo: true,
      },
    });
    vendedorRianEmail = vr.email;

    try {
      await prisma.seller.delete({ where: { id: "seed-seller-rian" } });
      console.log(
        "[seed] Vendedor demo seed-seller-rian removido (login Rian aponta para o cadastro real)."
      );
    } catch {
      /* já não existia ou ainda há FK — ignorar */
    }
  } else {
    console.warn(
      '[seed] Rian: defina SEED_RIAN_SILVA_SELLER_ID no .env ou cadastre um vendedor com nome "RIAN SILVA". Login rian@podpod.local não foi criado/atualizado.'
    );
  }

  console.log("\n=== PodPod — credenciais após seed (troque em produção) ===\n");
  console.log(
    `Administrador Ronan     ${ronan.email}     senha: (definida por SEED_RONAN_PASSWORD ou padrão no código)`
  );
  console.log(
    `Administrador legado    ${adminLegado.email}  mesma senha que Ronan (SEED_RONAN_PASSWORD)`
  );
  console.log(
    `Operador                ${operador.email}  senha: SEED_OPERADOR_PASSWORD ou padrão`
  );
  console.log(
    `Vendedor João (Centro)  ${vendedorJoao.email}  senha: SEED_VENDEDOR_JOAO_PASSWORD ou padrão`
  );
  console.log(
    `Vendedor Maria (demo)   ${vendedorMaria.email}  senha: SEED_VENDEDOR_MARIA_PASSWORD ou padrão`
  );
  if (vendedorRianEmail && rianSellerResolved) {
    console.log(
      `Vendedor Rian (real)    ${vendedorRianEmail}  seller=${rianSellerResolved.id} (${rianSellerResolved.nome})  senha: SEED_VENDEDOR_RIAN_PASSWORD ou padrão`
    );
  }
  console.log("\nPadrões locais (se não houver .env):", {
    SEED_RONAN_PASSWORD: P.ronan,
    SEED_OPERADOR_PASSWORD: P.operador,
    SEED_VENDEDOR_JOAO_PASSWORD: P.vendedorJoao,
    SEED_VENDEDOR_MARIA_PASSWORD: P.vendedorMaria,
    SEED_VENDEDOR_RIAN_PASSWORD: P.vendedorRian,
  });
  console.log("\nSeed OK — vendedores:", {
    v1: v1.nome,
    v2: v2.nome,
    estoqueGeral: `${ronanGeral.nome} (${ronanGeral.id}) — defina PODPOD_ESTOQUE_GERAL_SELLER_ID=${ronanGeral.id} no .env`,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
