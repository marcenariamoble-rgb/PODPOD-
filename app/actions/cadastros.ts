"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadProductPhotoFromForm } from "@/lib/upload-product-image";
import { ComissaoVendedorTipo, Prisma, Role } from "@prisma/client";

async function requireUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");
  return id;
}

function parseMoney(raw: string | null | undefined): Prisma.Decimal | null {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(",", "."));
  if (Number.isNaN(n) || n < 0) return null;
  return new Prisma.Decimal(n.toFixed(2));
}

function parseSellerComissaoFromForm(formData: FormData):
  | {
      ok: true;
      comissaoDescontaNaVenda: boolean;
      comissaoTipo: ComissaoVendedorTipo;
      comissaoPercentual: Prisma.Decimal | null;
      comissaoPorUnidade: Prisma.Decimal | null;
    }
  | { ok: false; error: string } {
  const desconta =
    String(formData.get("comissaoDescontaNaVenda") ?? "") === "true";
  const tipoStr = String(formData.get("comissaoTipo") ?? "NENHUMA").trim();

  let tipo: ComissaoVendedorTipo = ComissaoVendedorTipo.NENHUMA;
  if (tipoStr === "PERCENTUAL_SOBRE_VENDA") {
    tipo = ComissaoVendedorTipo.PERCENTUAL_SOBRE_VENDA;
  } else if (tipoStr === "FIXA_POR_UNIDADE") {
    tipo = ComissaoVendedorTipo.FIXA_POR_UNIDADE;
  }

  if (!desconta) {
    return {
      ok: true,
      comissaoDescontaNaVenda: false,
      comissaoTipo: ComissaoVendedorTipo.NENHUMA,
      comissaoPercentual: null,
      comissaoPorUnidade: null,
    };
  }

  if (tipo === ComissaoVendedorTipo.NENHUMA) {
    return {
      ok: false,
      error:
        "Defina como calcular a comissão: percentual sobre a venda ou valor fixo por unidade.",
    };
  }

  if (tipo === ComissaoVendedorTipo.PERCENTUAL_SOBRE_VENDA) {
    const p = parseMoney(String(formData.get("comissaoPercentual") ?? ""));
    if (p == null) {
      return {
        ok: false,
        error: "Informe o percentual de comissão (ex.: 15 para 15%).",
      };
    }
    const pn = Number(p);
    if (pn > 100 || pn < 0) {
      return {
        ok: false,
        error: "Percentual de comissão deve estar entre 0 e 100.",
      };
    }
    return {
      ok: true,
      comissaoDescontaNaVenda: true,
      comissaoTipo: tipo,
      comissaoPercentual: p,
      comissaoPorUnidade: null,
    };
  }

  const u = parseMoney(String(formData.get("comissaoPorUnidade") ?? ""));
  if (u == null) {
    return {
      ok: false,
      error: "Informe o valor de comissão fixa por unidade (R$).",
    };
  }
  return {
    ok: true,
    comissaoDescontaNaVenda: true,
    comissaoTipo: ComissaoVendedorTipo.FIXA_POR_UNIDADE,
    comissaoPercentual: null,
    comissaoPorUnidade: u,
  };
}

function skuFromNome(nome: string) {
  const slug = nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 24);
  return `${slug || "SKU"}-${Date.now().toString(36).toUpperCase()}`;
}

export async function actionCreateProduct(formData: FormData) {
  await requireUserId();
  const nome = String(formData.get("nome") ?? "").trim();
  const marca = String(formData.get("marca") ?? "").trim();
  const sabor = String(formData.get("sabor") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim() || "Geral";
  let sku = String(formData.get("sku") ?? "").trim();
  if (!nome || !marca || !sabor) {
    redirect("/produtos/novo?error=" + encodeURIComponent("Preencha nome, marca e sabor/variação."));
  }
  if (!sku) sku = skuFromNome(nome);

  const custo = parseMoney(String(formData.get("custoUnitario") ?? ""));
  const preco = parseMoney(String(formData.get("precoVendaSugerido") ?? ""));
  if (!custo || !preco) {
    redirect("/produtos/novo?error=" + encodeURIComponent("Informe custo e preço válidos."));
  }

  const estoqueMinimo = Number(formData.get("estoqueMinimo") ?? 0);
  if (Number.isNaN(estoqueMinimo) || estoqueMinimo < 0) {
    redirect("/produtos/novo?error=" + encodeURIComponent("Estoque mínimo inválido."));
  }

  const ativo = String(formData.get("ativo") ?? "true") === "true";

  const upload = await uploadProductPhotoFromForm(formData.get("foto"));
  if (!upload.ok) {
    redirect("/produtos/novo?error=" + encodeURIComponent(upload.message));
  }
  const fotoUrl = upload.url;

  try {
    await prisma.product.create({
      data: {
        nome,
        marca,
        sabor,
        categoria,
        sku,
        custoUnitario: custo,
        precoVendaSugerido: preco,
        estoqueMinimo,
        estoqueCentral: 0,
        ativo,
        fotoUrl,
      },
    });
  } catch (e) {
    const msg =
      e instanceof Error && e.message.includes("Unique")
        ? "Já existe um produto com este SKU."
        : "Não foi possível salvar o produto.";
    redirect("/produtos/novo?error=" + encodeURIComponent(msg));
  }

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function actionUpdateProduct(formData: FormData) {
  await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/produtos?error=" + encodeURIComponent("Produto inválido."));

  const nome = String(formData.get("nome") ?? "").trim();
  const marca = String(formData.get("marca") ?? "").trim();
  const sabor = String(formData.get("sabor") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim() || "Geral";
  const sku = String(formData.get("sku") ?? "").trim();
  const custo = parseMoney(String(formData.get("custoUnitario") ?? ""));
  const preco = parseMoney(String(formData.get("precoVendaSugerido") ?? ""));
  const estoqueMinimo = Number(formData.get("estoqueMinimo") ?? 0);

  if (!nome || !marca || !sabor || !sku || !custo || !preco) {
    redirect(
      `/produtos/${id}?error=` +
        encodeURIComponent("Preencha todos os campos obrigatórios corretamente.")
    );
  }
  if (Number.isNaN(estoqueMinimo) || estoqueMinimo < 0) {
    redirect(
      `/produtos/${id}?error=` + encodeURIComponent("Estoque mínimo inválido.")
    );
  }

  const ativo = String(formData.get("ativo") ?? "true") === "true";

  const upload = await uploadProductPhotoFromForm(formData.get("foto"));
  if (!upload.ok) {
    redirect(`/produtos/${id}?error=` + encodeURIComponent(upload.message));
  }
  const fotoUrlPreserve = String(formData.get("fotoUrl") ?? "").trim() || null;
  const fotoUrl = upload.url ?? fotoUrlPreserve;

  try {
    await prisma.product.update({
      where: { id },
      data: {
        nome,
        marca,
        sabor,
        categoria,
        sku,
        custoUnitario: custo,
        precoVendaSugerido: preco,
        estoqueMinimo,
        ativo,
        fotoUrl,
      },
    });
  } catch (e) {
    const msg =
      e instanceof Error && e.message.includes("Unique")
        ? "Já existe um produto com este SKU."
        : "Não foi possível atualizar.";
    redirect(`/produtos/${id}?error=` + encodeURIComponent(msg));
  }

  revalidatePath("/produtos");
  revalidatePath(`/produtos/${id}`);
  redirect(`/produtos/${id}`);
}

export async function actionToggleProductAtivo(formData: FormData) {
  await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return;
  await prisma.product.update({
    where: { id },
    data: { ativo: !p.ativo },
  });
  revalidatePath("/produtos");
  revalidatePath(`/produtos/${id}`);
  redirect(`/produtos/${id}`);
}

/** Remove o produto e todo o histórico associado (vendas, movimentações, linhas de estoque em vendedores). */
export async function actionDeleteProduct(formData: FormData) {
  await requireUserId();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/produtos?error=" + encodeURIComponent("Produto inválido."));
  }

  const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    redirect("/produtos?error=" + encodeURIComponent("Produto não encontrado."));
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.venda.deleteMany({ where: { produtoId: id } });
      await tx.movimentacaoEstoque.deleteMany({ where: { produtoId: id } });
      await tx.sellerProductStock.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });
  } catch {
    redirect(
      "/produtos?error=" +
        encodeURIComponent(
          "Não foi possível excluir. Tente novamente ou contacte o suporte."
        )
    );
  }

  revalidatePath("/produtos");
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
  revalidatePath("/vendedores");
  revalidatePath("/estoque/entrada");
  redirect("/produtos?deleted=1");
}

export async function actionCreateSeller(formData: FormData) {
  await requireUserId();
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) {
    redirect("/vendedores/novo?error=" + encodeURIComponent("Informe o nome."));
  }

  const telefone = String(formData.get("telefone") ?? "").trim() || null;
  const cidade = String(formData.get("cidade") ?? "").trim() || null;
  const regiao = String(formData.get("regiao") ?? "").trim() || null;
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;
  const limiteRaw = String(formData.get("limiteComodato") ?? "").trim();
  const limiteComodato =
    limiteRaw === "" ? null : Number(limiteRaw);
  if (limiteRaw !== "" && (Number.isNaN(limiteComodato) || (limiteComodato ?? 0) < 0)) {
    redirect(
      "/vendedores/novo?error=" + encodeURIComponent("Limite de comodato inválido.")
    );
  }

  const ativo = String(formData.get("ativo") ?? "true") === "true";

  const comissao = parseSellerComissaoFromForm(formData);
  if (!comissao.ok) {
    redirect(
      "/vendedores/novo?error=" + encodeURIComponent(comissao.error)
    );
  }

  await prisma.seller.create({
    data: {
      nome,
      telefone,
      cidade,
      regiao,
      limiteComodato,
      observacoes,
      ativo,
      comissaoDescontaNaVenda: comissao.comissaoDescontaNaVenda,
      comissaoTipo: comissao.comissaoTipo,
      comissaoPercentual: comissao.comissaoPercentual,
      comissaoPorUnidade: comissao.comissaoPorUnidade,
    },
  });

  revalidatePath("/vendedores");
  redirect("/vendedores");
}

export async function actionUpdateSeller(formData: FormData) {
  await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/vendedores");

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) {
    redirect(
      `/vendedores/${id}?error=` + encodeURIComponent("Informe o nome.")
    );
  }

  const telefone = String(formData.get("telefone") ?? "").trim() || null;
  const cidade = String(formData.get("cidade") ?? "").trim() || null;
  const regiao = String(formData.get("regiao") ?? "").trim() || null;
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;
  const limiteRaw = String(formData.get("limiteComodato") ?? "").trim();
  const limiteComodato =
    limiteRaw === "" ? null : Number(limiteRaw);
  if (limiteRaw !== "" && (Number.isNaN(limiteComodato) || (limiteComodato ?? 0) < 0)) {
    redirect(
      `/vendedores/${id}?error=` +
        encodeURIComponent("Limite de comodato inválido.")
    );
  }

  const ativo = String(formData.get("ativo") ?? "true") === "true";

  const comissao = parseSellerComissaoFromForm(formData);
  if (!comissao.ok) {
    redirect(`/vendedores/${id}?error=` + encodeURIComponent(comissao.error));
  }

  await prisma.seller.update({
    where: { id },
    data: {
      nome,
      telefone,
      cidade,
      regiao,
      limiteComodato,
      observacoes,
      ativo,
      comissaoDescontaNaVenda: comissao.comissaoDescontaNaVenda,
      comissaoTipo: comissao.comissaoTipo,
      comissaoPercentual: comissao.comissaoPercentual,
      comissaoPorUnidade: comissao.comissaoPorUnidade,
    },
  });

  revalidatePath("/vendedores");
  revalidatePath(`/vendedores/${id}`);
  redirect(`/vendedores/${id}`);
}

export async function actionToggleSellerAtivo(formData: FormData) {
  await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const s = await prisma.seller.findUnique({ where: { id } });
  if (!s) return;
  await prisma.seller.update({
    where: { id },
    data: { ativo: !s.ativo },
  });
  revalidatePath("/vendedores");
  revalidatePath(`/vendedores/${id}`);
  redirect(`/vendedores/${id}`);
}

/** Remove o vendedor e dados ligados (vendas, recebimentos, movimentações, estoque em posse). Desvincula o utilizador da app (passa a OPERADOR). */
export async function actionDeleteSeller(formData: FormData) {
  await requireUserId();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/vendedores?error=" + encodeURIComponent("Vendedor inválido."));
  }

  const exists = await prisma.seller.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    redirect("/vendedores?error=" + encodeURIComponent("Vendedor não encontrado."));
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.recebimento.deleteMany({ where: { vendedorId: id } });
      await tx.venda.deleteMany({ where: { vendedorId: id } });
      await tx.movimentacaoEstoque.deleteMany({ where: { vendedorId: id } });
      await tx.sellerProductStock.deleteMany({ where: { sellerId: id } });
      await tx.user.updateMany({
        where: { sellerId: id },
        data: { sellerId: null, role: Role.OPERADOR },
      });
      await tx.seller.delete({ where: { id } });
    });
  } catch {
    redirect(
      "/vendedores?error=" +
        encodeURIComponent(
          "Não foi possível excluir. Tente novamente ou contacte o suporte."
        )
    );
  }

  revalidatePath("/vendedores");
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
  revalidatePath("/produtos");
  redirect("/vendedores?deleted=1");
}
