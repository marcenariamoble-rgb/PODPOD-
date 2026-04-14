"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  ajusteEstoque,
  entregarComodato,
  entregarComodatoLote,
  registrarConsumoProprioVendedor,
  registrarDevolucao,
  registrarEntradaManual,
  registrarPerda,
  registrarRecebimento,
  registrarSaidaManual,
  registrarVenda,
  estornarVenda,
} from "@/lib/services/estoque.service";

async function getUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Não autenticado.");
  return id;
}

function withParam(path: string, key: string, value: string) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${key}=${encodeURIComponent(value)}`;
}

export async function actionEntradaManual(formData: FormData) {
  const redirectAfter =
    String(formData.get("redirectAfter") ?? "/estoque/entrada").trim() ||
    "/estoque/entrada";
  const observacoes = String(formData.get("observacoes") ?? "") || undefined;
  const productIds = formData.getAll("productId").map((v) => String(v ?? "").trim());
  const quantidades = formData
    .getAll("quantidade")
    .map((v) => Math.floor(Number(v)))
    .map((n) => (Number.isFinite(n) ? n : 0));
  const custos = formData
    .getAll("custoUnitario")
    .map((v) => String(v ?? "").trim())
    .map((raw) => {
      if (raw === "") return null;
      const n = Number(raw.replace(",", "."));
      return Number.isFinite(n) ? n : Number.NaN;
    });

  const itens = productIds
    .map((productId, i) => ({
      productId,
      quantidade: quantidades[i] ?? 0,
      custoUnitario: custos[i] ?? null,
    }))
    .filter((i) => i.productId && i.quantidade > 0);

  if (itens.length === 0) {
    redirect(withParam(redirectAfter, "error", "Informe ao menos um item para entrada."));
  }
  if (itens.some((i) => i.custoUnitario != null && (!Number.isFinite(i.custoUnitario) || i.custoUnitario < 0))) {
    redirect(withParam(redirectAfter, "error", "Custo unitário inválido em uma das linhas."));
  }

  try {
    const userId = await getUserId();
    for (let i = 0; i < itens.length; i += 1) {
      const item = itens[i];
      await registrarEntradaManual({
        productId: item.productId,
        quantidade: item.quantidade,
        observacoes: observacoes ? `[Lote ${i + 1}] ${observacoes}` : undefined,
        custoUnitario:
          item.custoUnitario != null && !Number.isNaN(item.custoUnitario)
            ? item.custoUnitario
            : null,
        usuarioId: userId,
      });
    }
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Não foi possível registrar a entrada.";
    redirect(withParam(redirectAfter, "error", msg));
  }
  revalidatePath("/produtos");
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
  revalidatePath("/estoque/entrada");
  revalidatePath("/comodato/estoque");
  revalidatePath("/cardapio");
  redirect(withParam(redirectAfter, "ok", "1"));
}

export async function actionSaidaManual(formData: FormData) {
  const redirectAfter =
    String(formData.get("redirectAfter") ?? "/movimentacoes/saida").trim() ||
    "/movimentacoes/saida";
  const productId = String(formData.get("productId") ?? "");
  const quantidade = Number(formData.get("quantidade"));
  const observacoes = String(formData.get("observacoes") ?? "") || undefined;
  const vuRaw = String(formData.get("valorUnitario") ?? "").trim();
  const valorUnitario =
    vuRaw === "" ? null : Number(vuRaw.replace(",", "."));
  try {
    await registrarSaidaManual({
      productId,
      quantidade,
      observacoes,
      valorUnitarioReferencia:
        valorUnitario != null && !Number.isNaN(valorUnitario) && valorUnitario >= 0
          ? valorUnitario
          : null,
      usuarioId: await getUserId(),
    });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Não foi possível registrar a saída.";
    redirect(withParam(redirectAfter, "error", msg));
  }
  revalidatePath("/produtos");
  revalidatePath(`/produtos/${productId}`);
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
  revalidatePath("/movimentacoes/saida");
  redirect(withParam(redirectAfter, "ok", "1"));
}

export async function actionAjusteEstoque(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const vendedorIdRaw = formData.get("vendedorId");
  const vendedorId =
    vendedorIdRaw && String(vendedorIdRaw) !== ""
      ? String(vendedorIdRaw)
      : null;
  const quantidadeDelta = Number(formData.get("quantidadeDelta"));
  const justificativa = String(formData.get("justificativa") ?? "");
  await ajusteEstoque({
    productId,
    vendedorId,
    quantidadeDelta,
    justificativa,
    usuarioId: await getUserId(),
  });
  revalidatePath("/produtos");
  revalidatePath(`/produtos/${productId}`);
  revalidatePath("/vendedores");
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
  revalidatePath("/comodato/estoque");
  revalidatePath("/comodato/operacoes");
}

export async function actionComodato(formData: FormData) {
  const redirectAfter =
    String(formData.get("redirectAfter") ?? "/comodato").trim() || "/comodato";
  const productIds = formData.getAll("productId").map((v) => String(v ?? ""));
  const quantidades = formData.getAll("quantidade").map((v) => Number(v));
  const valores = formData
    .getAll("valorUnitario")
    .map((v) => String(v ?? "").trim())
    .map((raw) => (raw === "" ? null : Number(raw.replace(",", "."))));

  const itens = productIds.map((productId, idx) => ({
    productId,
    quantidade: quantidades[idx] ?? 0,
    valorUnitarioReferencia: valores[idx] ?? null,
  }));

  try {
    await entregarComodatoLote({
      vendedorId: String(formData.get("vendedorId") ?? ""),
      itens,
      observacoes: String(formData.get("observacoes") ?? "") || undefined,
      usuarioId: await getUserId(),
    });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Não foi possível registrar a entrega.";
    redirect(withParam(redirectAfter, "error", msg));
  }
  revalidatePath("/dashboard");
  revalidatePath("/produtos");
  revalidatePath("/vendedores");
  revalidatePath("/movimentacoes");
  revalidatePath("/comodato/estoque");
  revalidatePath("/comodato/operacoes");
  redirect(withParam(redirectAfter, "ok", "1"));
}

export async function actionConsumoProprioAdmin(formData: FormData) {
  const redirectAfter =
    String(formData.get("redirectAfter") ?? "/consumo-proprio").trim() ||
    "/consumo-proprio";
  const sellerProductRaw = String(formData.get("sellerProduct") ?? "");
  const [sellerIdFromPair, productIdFromPair] = sellerProductRaw.split("|");
  const vendedorId = String(formData.get("vendedorId") ?? sellerIdFromPair ?? "");
  const productId = String(formData.get("productId") ?? productIdFromPair ?? "");
  try {
    await registrarConsumoProprioVendedor({
      vendedorId,
      productId,
      quantidade: Number(formData.get("quantidade")),
      observacoes: String(formData.get("observacoes") ?? "") || undefined,
      usuarioId: await getUserId(),
    });
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Não foi possível registrar consumo próprio manual.";
    redirect(withParam(redirectAfter, "error", msg));
  }

  revalidatePath("/consumo-proprio");
  revalidatePath("/vendedor/consumo-proprio");
  revalidatePath("/vendedor/estoque");
  revalidatePath("/vendas");
  revalidatePath("/movimentacoes");
  revalidatePath("/financeiro");
  redirect(withParam(redirectAfter, "ok", "consumo_add"));
}

export async function actionEstornarVenda(formData: FormData) {
  const redirectAfter =
    String(formData.get("redirectAfter") ?? "/dashboard").trim() || "/dashboard";
  const vendaId = String(formData.get("vendaId") ?? "");
  try {
    await estornarVenda({
      vendaId,
      usuarioId: await getUserId(),
    });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Não foi possível estornar a venda.";
    redirect(withParam(redirectAfter, "error", msg));
  }
  revalidatePath("/dashboard");
  revalidatePath(redirectAfter);
  revalidatePath("/vendedores");
  revalidatePath("/produtos");
  revalidatePath("/movimentacoes");
  revalidatePath("/comodato/estoque");
  revalidatePath("/relatorios");
  revalidatePath("/devolucoes/nova");
  revalidatePath("/vendas");
  revalidatePath("/financeiro");
  revalidatePath("/recebimentos/nova");
  redirect(withParam(redirectAfter, "ok", "estorno"));
}

export async function actionVenda(formData: FormData) {
  const redirectAfter =
    String(formData.get("redirectAfter") ?? "/vendas/nova").trim() || "/vendas/nova";
  const vendedorId = String(formData.get("vendedorId") ?? "");
  const formaPagamento = String(formData.get("formaPagamento") ?? "") || undefined;
  const observacoes = String(formData.get("observacoes") ?? "") || undefined;
  const produtos = formData.getAll("productId").map((v) => String(v ?? "").trim());
  const quantidades = formData
    .getAll("quantidade")
    .map((v) => Math.floor(Number(v)))
    .map((n) => (Number.isFinite(n) ? n : 0));
  const valores = formData
    .getAll("valorUnitario")
    .map((v) => {
      const raw = String(v ?? "").trim().replace(",", ".");
      if (raw === "") return Number.NaN;
      return Number(raw);
    })
    .map((n) => (Number.isFinite(n) ? n : NaN));

  const itens = produtos
    .map((productId, i) => ({
      productId,
      quantidade: quantidades[i] ?? 0,
      valorUnitario: valores[i] ?? NaN,
    }))
    .filter((i) => i.productId && i.quantidade > 0);

  if (itens.some((i) => !Number.isFinite(i.valorUnitario) || i.valorUnitario < 0)) {
    redirect(
      withParam(
        redirectAfter,
        "error",
        "Informe o valor unitário para todos os itens preenchidos."
      )
    );
  }

  if (itens.length === 0) {
    redirect(withParam(redirectAfter, "error", "Informe ao menos um item para venda."));
  }

  const userId = await getUserId();
  try {
    for (let i = 0; i < itens.length; i += 1) {
      const item = itens[i];
      await registrarVenda({
        vendedorId,
        productId: item.productId,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        formaPagamento,
        observacoes: observacoes ? `[Lote ${i + 1}] ${observacoes}` : undefined,
        usuarioId: userId,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Não foi possível registrar a venda em lote.";
    redirect(withParam(redirectAfter, "error", msg));
  }
  revalidatePath("/dashboard");
  revalidatePath("/vendas");
  revalidatePath("/vendedores");
  revalidatePath("/movimentacoes");
  revalidatePath("/produtos");
  revalidatePath("/financeiro");
  redirect(withParam(redirectAfter, "ok", "1"));
}

export async function actionDevolucao(formData: FormData) {
  await registrarDevolucao({
    vendedorId: String(formData.get("vendedorId") ?? ""),
    productId: String(formData.get("productId") ?? ""),
    quantidade: Number(formData.get("quantidade")),
    observacoes: String(formData.get("observacoes") ?? "") || undefined,
    usuarioId: await getUserId(),
  });
  revalidatePath("/dashboard");
  revalidatePath("/produtos");
  revalidatePath("/vendedores");
  revalidatePath("/movimentacoes");
  revalidatePath("/devolucoes/nova");
  revalidatePath("/comodato/estoque");
  revalidatePath("/comodato/operacoes");
  revalidatePath("/vendas");
  revalidatePath("/financeiro");
}

export async function actionRecebimento(formData: FormData) {
  await registrarRecebimento({
    vendedorId: String(formData.get("vendedorId") ?? ""),
    valorRecebido: Number(formData.get("valorRecebido")),
    formaPagamento: String(formData.get("formaPagamento") ?? ""),
    observacoes: String(formData.get("observacoes") ?? "") || undefined,
  });
  revalidatePath("/dashboard");
  revalidatePath("/vendas");
  revalidatePath("/vendedores");
  revalidatePath("/financeiro");
}

export async function actionPerda(formData: FormData) {
  const v = formData.get("vendedorId");
  await registrarPerda({
    productId: String(formData.get("productId") ?? ""),
    vendedorId: v && String(v) !== "" ? String(v) : null,
    quantidade: Number(formData.get("quantidade")),
    observacoes: String(formData.get("observacoes") ?? "") || undefined,
    usuarioId: await getUserId(),
  });
  revalidatePath("/dashboard");
  revalidatePath("/produtos");
  revalidatePath("/vendedores");
  revalidatePath("/movimentacoes");
}
