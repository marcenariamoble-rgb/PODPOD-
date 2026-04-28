import { randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";
import { TipoMovimentacao } from "@prisma/client";
import { getDetentorEstoqueGeralSellerId } from "@/lib/config/estoque-geral";
import { prisma } from "@/lib/db";
import { calcularRepasseVenda } from "@/lib/services/comissao-vendedor.service";
import {
  calcularMontanteRepasseCobertoFifoForVenda,
  recalcularStatusVendasVendedor,
} from "@/lib/services/financeiro.service";
import { toNumber } from "@/lib/utils/money";

export async function registrarEntradaManual(input: {
  productId: string;
  quantidade: number;
  observacoes?: string;
  /** Custo unitário opcional (registrado na movimentação). */
  custoUnitario?: number | null;
  usuarioId: string;
}) {
  const { productId, quantidade, observacoes, custoUnitario, usuarioId } = input;
  await prisma.$transaction(async (tx) => {
    await registrarEntradaManualWithTx(tx, {
      productId,
      quantidade,
      observacoes,
      custoUnitario,
      usuarioId,
    });
  });
}

async function registrarEntradaManualWithTx(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    quantidade: number;
    observacoes?: string;
    custoUnitario?: number | null;
    usuarioId: string;
  }
) {
  const { productId, quantidade, observacoes, custoUnitario, usuarioId } = input;
  if (quantidade <= 0) throw new Error("Quantidade deve ser maior que zero.");

  const vu =
    custoUnitario != null && !Number.isNaN(custoUnitario) && custoUnitario >= 0
      ? custoUnitario
      : null;
  const valorTotal = vu != null ? vu * quantidade : null;
  const detentorGeralId = getDetentorEstoqueGeralSellerId();

  const product = await tx.product.findUniqueOrThrow({
    where: { id: productId },
    select: { estoqueCentral: true, custoUnitario: true },
  });
  let custoAtualizado: number | undefined;
  if (vu != null) {
    const custoAnterior = toNumber(product.custoUnitario);
    const estoqueAnterior = product.estoqueCentral;
    const totalAnterior = custoAnterior * estoqueAnterior;
    const totalNovo = vu * quantidade;
    const base = estoqueAnterior + quantidade;
    if (base > 0) {
      // Custo medio ponderado: reflete entradas com preços diferentes.
      custoAtualizado = Number(((totalAnterior + totalNovo) / base).toFixed(2));
    }
  }

  await tx.product.update({
    where: { id: productId },
    data: {
      estoqueCentral: { increment: quantidade },
      ...(custoAtualizado != null ? { custoUnitario: custoAtualizado } : {}),
    },
  });
  await tx.movimentacaoEstoque.create({
    data: {
      tipoMovimentacao: TipoMovimentacao.ENTRADA,
      produtoId: productId,
      vendedorId: detentorGeralId,
      quantidade,
      valorUnitario: vu,
      valorTotal,
      observacoes: observacoes ?? null,
      usuarioResponsavelId: usuarioId,
    },
  });
}

export async function registrarEntradaManualLote(input: {
  itens: Array<{
    productId: string;
    quantidade: number;
    custoUnitario?: number | null;
    observacoes?: string;
  }>;
  usuarioId: string;
}) {
  const itens = input.itens
    .map((i) => ({
      productId: String(i.productId ?? "").trim(),
      quantidade: Math.floor(Number(i.quantidade)),
      custoUnitario:
        i.custoUnitario != null && Number.isFinite(i.custoUnitario)
          ? Number(i.custoUnitario)
          : null,
      observacoes: i.observacoes,
    }))
    .filter((i) => i.productId && i.quantidade > 0);
  if (itens.length === 0) {
    throw new Error("Informe pelo menos um item para entrada.");
  }

  await prisma.$transaction(async (tx) => {
    for (const item of itens) {
      await registrarEntradaManualWithTx(tx, {
        productId: item.productId,
        quantidade: item.quantidade,
        observacoes: item.observacoes,
        custoUnitario: item.custoUnitario,
        usuarioId: input.usuarioId,
      });
    }
  });
}

/** Retira unidades do estoque central (amostras, consumo interno, etc.). */
export async function registrarSaidaManual(input: {
  productId: string;
  quantidade: number;
  observacoes?: string;
  valorUnitarioReferencia?: number | null;
  usuarioId: string;
}) {
  const {
    productId,
    quantidade,
    observacoes,
    valorUnitarioReferencia,
    usuarioId,
  } = input;
  if (quantidade <= 0) throw new Error("Quantidade inválida.");

  await prisma.$transaction(async (tx) => {
    const p = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    if (p.estoqueCentral < quantidade) {
      throw new Error("Estoque central insuficiente para esta saída.");
    }

    const vu =
      valorUnitarioReferencia != null &&
      !Number.isNaN(valorUnitarioReferencia) &&
      valorUnitarioReferencia >= 0
        ? valorUnitarioReferencia
        : null;
    const valorTotal = vu != null ? vu * quantidade : null;

    await tx.product.update({
      where: { id: productId },
      data: { estoqueCentral: { decrement: quantidade } },
    });

    await tx.movimentacaoEstoque.create({
      data: {
        tipoMovimentacao: TipoMovimentacao.SAIDA_MANUAL,
        produtoId: productId,
        quantidade,
        valorUnitario: vu,
        valorTotal,
        observacoes: observacoes ?? null,
        usuarioResponsavelId: usuarioId,
      },
    });
  });
}

export async function ajusteEstoque(input: {
  productId: string;
  vendedorId?: string | null;
  quantidadeDelta: number;
  justificativa: string;
  usuarioId: string;
}) {
  const { productId, vendedorId, quantidadeDelta, justificativa, usuarioId } =
    input;
  if (!justificativa?.trim()) throw new Error("Justificativa obrigatória.");
  if (quantidadeDelta === 0) throw new Error("Informe uma variação diferente de zero.");

  await prisma.$transaction(async (tx) => {
    if (vendedorId) {
      const row = await ensureSellerStockWithTx(tx, vendedorId, productId);
      const next = row.quantidade + quantidadeDelta;
      if (next < 0) throw new Error("Estoque do vendedor ficaria negativo.");
      await tx.sellerProductStock.update({
        where: { id: row.id },
        data: { quantidade: next },
      });
    } else {
      const p = await tx.product.findUniqueOrThrow({ where: { id: productId } });
      const next = p.estoqueCentral + quantidadeDelta;
      if (next < 0) throw new Error("Estoque central ficaria negativo.");
      await tx.product.update({
        where: { id: productId },
        data: { estoqueCentral: next },
      });
    }

    await tx.movimentacaoEstoque.create({
      data: {
        tipoMovimentacao: TipoMovimentacao.AJUSTE,
        produtoId: productId,
        vendedorId: vendedorId ?? null,
        quantidade: quantidadeDelta,
        observacoes: justificativa.trim(),
        usuarioResponsavelId: usuarioId,
      },
    });
  });
}

async function ensureSellerStockWithTx(
  tx: Prisma.TransactionClient,
  sellerId: string,
  productId: string
) {
  return tx.sellerProductStock.upsert({
    where: { sellerId_productId: { sellerId, productId } },
    create: { sellerId, productId, quantidade: 0 },
    update: {},
  });
}

/** Transfere unidades do central para o vendedor (comodato) dentro da mesma transação da venda. */
async function alocarCentralParaVendedorParaVenda(
  tx: Prisma.TransactionClient,
  vendedorId: string,
  productId: string,
  falta: number,
  usuarioId: string
) {
  const unidades = Math.max(0, Math.floor(Number(falta)));
  if (!Number.isFinite(unidades) || unidades <= 0) return;

  const product = await tx.product.findUniqueOrThrow({
    where: { id: productId },
  });
  if (product.estoqueCentral < unidades) {
    throw new Error(
      "Estoque em posse insuficiente e o central não tem unidades para cobrir o restante. Dê entrada no estoque ou faça uma entrega em comodato antes."
    );
  }

  const seller = await tx.seller.findUniqueOrThrow({
    where: { id: vendedorId },
  });
  if (seller.limiteComodato != null) {
    const agg = await tx.sellerProductStock.aggregate({
      where: { sellerId: vendedorId },
      _sum: { quantidade: true },
    });
    const totalPosse = agg._sum.quantidade ?? 0;
    if (totalPosse + unidades > seller.limiteComodato) {
      throw new Error(
        "Limite de comodato do vendedor seria excedido ao completar esta venda. Aumente o limite, faça uma entrega manual ou reduza a quantidade."
      );
    }
  }

  await tx.product.update({
    where: { id: productId },
    data: { estoqueCentral: { decrement: unidades } },
  });

  const row = await ensureSellerStockWithTx(tx, vendedorId, productId);
  await tx.sellerProductStock.update({
    where: { id: row.id },
    data: { quantidade: { increment: unidades } },
  });

  const vu = toNumber(product.precoVendaSugerido);
  await tx.movimentacaoEstoque.create({
    data: {
      tipoMovimentacao: TipoMovimentacao.ENTREGA_COMODATO,
      produtoId: productId,
      vendedorId,
      quantidade: unidades,
      valorUnitario: vu,
      valorTotal: vu * unidades,
      observacoes:
        "Alocação automática do estoque central para registrar a venda.",
      usuarioResponsavelId: usuarioId,
    },
  });
}

export async function entregarComodato(input: {
  vendedorId: string;
  productId: string;
  quantidade: number;
  valorUnitarioReferencia?: number | null;
  observacoes?: string;
  usuarioId: string;
}) {
  const {
    vendedorId,
    productId,
    quantidade,
    valorUnitarioReferencia,
    observacoes,
    usuarioId,
  } = input;
  if (quantidade <= 0) throw new Error("Quantidade inválida.");

  const detentorId = getDetentorEstoqueGeralSellerId();
  if (detentorId && vendedorId === detentorId) {
    throw new Error(
      "O depósito geral não recebe comodato por esta tela — use Entrada no estoque para repor o central."
    );
  }

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
    });
    if (product.estoqueCentral < quantidade) {
      throw new Error("Estoque central insuficiente.");
    }

    const seller = await tx.seller.findUniqueOrThrow({
      where: { id: vendedorId },
    });
    if (seller.limiteComodato != null) {
      const agg = await tx.sellerProductStock.aggregate({
        where: { sellerId: vendedorId },
        _sum: { quantidade: true },
      });
      const emPosse = agg._sum.quantidade ?? 0;
      if (emPosse + quantidade > seller.limiteComodato) {
        throw new Error("Limite de comodato do vendedor excedido.");
      }
    }

    await tx.product.update({
      where: { id: productId },
      data: { estoqueCentral: { decrement: quantidade } },
    });

    const row = await ensureSellerStockWithTx(tx, vendedorId, productId);
    await tx.sellerProductStock.update({
      where: { id: row.id },
      data: { quantidade: { increment: quantidade } },
    });

    const vu =
      valorUnitarioReferencia != null
        ? valorUnitarioReferencia
        : toNumber(product.precoVendaSugerido);
    const valorTotal = vu * quantidade;

    await tx.movimentacaoEstoque.create({
      data: {
        tipoMovimentacao: TipoMovimentacao.ENTREGA_COMODATO,
        produtoId: productId,
        vendedorId,
        quantidade,
        valorUnitario: vu,
        valorTotal,
        observacoes: observacoes ?? null,
        usuarioResponsavelId: usuarioId,
      },
    });
  });
}

export async function entregarComodatoLote(input: {
  vendedorId: string;
  itens: Array<{
    productId: string;
    quantidade: number;
    valorUnitarioReferencia?: number | null;
  }>;
  observacoes?: string;
  usuarioId: string;
}) {
  const vendedorId = String(input.vendedorId ?? "").trim();
  const itens = input.itens
    .map((i) => ({
      productId: String(i.productId ?? "").trim(),
      quantidade: Math.floor(Number(i.quantidade)),
      valorUnitarioReferencia:
        i.valorUnitarioReferencia != null &&
        Number.isFinite(i.valorUnitarioReferencia) &&
        i.valorUnitarioReferencia >= 0
          ? i.valorUnitarioReferencia
          : null,
    }))
    .filter((i) => i.productId && i.quantidade > 0);

  if (!vendedorId) throw new Error("Vendedor inválido.");
  if (itens.length === 0) {
    throw new Error("Informe pelo menos um produto com quantidade maior que zero.");
  }

  const detentorId = getDetentorEstoqueGeralSellerId();
  if (detentorId && vendedorId === detentorId) {
    throw new Error(
      "O depósito geral não recebe comodato por esta tela — use Entrada no estoque para repor o central."
    );
  }

  await prisma.$transaction(async (tx) => {
    const seller = await tx.seller.findUniqueOrThrow({
      where: { id: vendedorId },
    });

    for (let idx = 0; idx < itens.length; idx += 1) {
      const item = itens[idx];
      if (item.quantidade <= 0) {
        throw new Error(`Item ${idx + 1}: quantidade inválida.`);
      }

      const product = await tx.product.findUniqueOrThrow({
        where: { id: item.productId },
      });
      if (product.estoqueCentral < item.quantidade) {
        throw new Error(
          `Item ${idx + 1} (${product.nome}): estoque central insuficiente.`
        );
      }

      if (seller.limiteComodato != null) {
        const agg = await tx.sellerProductStock.aggregate({
          where: { sellerId: vendedorId },
          _sum: { quantidade: true },
        });
        const emPosse = agg._sum.quantidade ?? 0;
        if (emPosse + item.quantidade > seller.limiteComodato) {
          throw new Error(
            `Item ${idx + 1} (${product.nome}): limite de comodato do vendedor excedido.`
          );
        }
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { estoqueCentral: { decrement: item.quantidade } },
      });

      const row = await ensureSellerStockWithTx(tx, vendedorId, item.productId);
      await tx.sellerProductStock.update({
        where: { id: row.id },
        data: { quantidade: { increment: item.quantidade } },
      });

      const vu =
        item.valorUnitarioReferencia != null
          ? item.valorUnitarioReferencia
          : toNumber(product.precoVendaSugerido);
      const valorTotal = vu * item.quantidade;

      await tx.movimentacaoEstoque.create({
        data: {
          tipoMovimentacao: TipoMovimentacao.ENTREGA_COMODATO,
          produtoId: item.productId,
          vendedorId,
          quantidade: item.quantidade,
          valorUnitario: vu,
          valorTotal,
          observacoes: input.observacoes ?? null,
          usuarioResponsavelId: input.usuarioId,
        },
      });
    }
  });
}

export async function registrarDevolucao(input: {
  vendedorId: string;
  productId: string;
  quantidade: number;
  observacoes?: string;
  usuarioId: string;
}) {
  const { vendedorId, productId, quantidade, observacoes, usuarioId } = input;
  if (quantidade <= 0) throw new Error("Quantidade inválida.");

  await prisma.$transaction(async (tx) => {
    const row = await tx.sellerProductStock.findUnique({
      where: { sellerId_productId: { sellerId: vendedorId, productId } },
    });
    const emPosse = row?.quantidade ?? 0;
    if (emPosse < quantidade) {
      throw new Error("Vendedor não possui quantidade suficiente em posse.");
    }

    await tx.sellerProductStock.update({
      where: { sellerId_productId: { sellerId: vendedorId, productId } },
      data: { quantidade: { decrement: quantidade } },
    });

    await tx.product.update({
      where: { id: productId },
      data: { estoqueCentral: { increment: quantidade } },
    });

    await tx.movimentacaoEstoque.create({
      data: {
        tipoMovimentacao: TipoMovimentacao.DEVOLUCAO,
        produtoId: productId,
        vendedorId,
        quantidade,
        observacoes: observacoes ?? null,
        usuarioResponsavelId: usuarioId,
      },
    });
  });
}

export async function registrarPerda(input: {
  productId: string;
  vendedorId?: string | null;
  quantidade: number;
  observacoes?: string;
  usuarioId: string;
}) {
  const { productId, vendedorId, quantidade, observacoes, usuarioId } = input;
  if (quantidade <= 0) throw new Error("Quantidade inválida.");

  await prisma.$transaction(async (tx) => {
    if (vendedorId) {
      const row = await tx.sellerProductStock.findUnique({
        where: { sellerId_productId: { sellerId: vendedorId, productId } },
      });
      const emPosse = row?.quantidade ?? 0;
      if (emPosse < quantidade) {
        throw new Error("Estoque em posse insuficiente para registrar perda.");
      }
      await tx.sellerProductStock.update({
        where: { sellerId_productId: { sellerId: vendedorId, productId } },
        data: { quantidade: { decrement: quantidade } },
      });
    } else {
      const p = await tx.product.findUniqueOrThrow({ where: { id: productId } });
      if (p.estoqueCentral < quantidade) {
        throw new Error("Estoque central insuficiente para registrar perda.");
      }
      await tx.product.update({
        where: { id: productId },
        data: { estoqueCentral: { decrement: quantidade } },
      });
    }

    await tx.movimentacaoEstoque.create({
      data: {
        tipoMovimentacao: TipoMovimentacao.PERDA,
        produtoId: productId,
        vendedorId: vendedorId ?? null,
        quantidade,
        observacoes: observacoes ?? null,
        usuarioResponsavelId: usuarioId,
      },
    });
  });
}

export async function registrarVenda(input: {
  vendedorId: string;
  productId: string;
  quantidade: number;
  valorUnitario: number;
  formaPagamento?: string | null;
  observacoes?: string;
  usuarioId: string;
}) {
  await prisma.$transaction(async (tx) => {
    await registrarVendaWithTx(tx, input);
  });

  await recalcularStatusVendasVendedor(String(input.vendedorId ?? "").trim());
}

async function registrarVendaWithTx(
  tx: Prisma.TransactionClient,
  input: {
    vendedorId: string;
    productId: string;
    quantidade: number;
    valorUnitario: number;
    formaPagamento?: string | null;
    observacoes?: string;
    usuarioId: string;
  }
) {
  const vendedorId = String(input.vendedorId ?? "").trim();
  const productId = String(input.productId ?? "").trim();
  const qtd = Math.floor(Math.max(0, Number(input.quantidade)));
  const valorUnitario = Number(input.valorUnitario);
  const { formaPagamento, observacoes, usuarioId } = input;

  if (!vendedorId || !productId) {
    throw new Error("Vendedor ou produto inválido.");
  }
  if (!Number.isFinite(qtd) || qtd < 1) {
    throw new Error("Quantidade inválida.");
  }
  if (!Number.isFinite(valorUnitario) || valorUnitario < 0) {
    throw new Error("Valor unitário inválido.");
  }

  const valorTotal = qtd * valorUnitario;

  const row = await tx.sellerProductStock.findUnique({
    where: { sellerId_productId: { sellerId: vendedorId, productId } },
  });
  const emPosse = Math.max(0, Math.floor(Number(row?.quantidade ?? 0)));
  const falta = Math.max(0, qtd - emPosse);

  await alocarCentralParaVendedorParaVenda(
    tx,
    vendedorId,
    productId,
    falta,
    usuarioId
  );

  const rowAtual = await tx.sellerProductStock.findUnique({
    where: { sellerId_productId: { sellerId: vendedorId, productId } },
  });
  const disponivel = Math.max(0, Math.floor(Number(rowAtual?.quantidade ?? 0)));
  if (disponivel < qtd) {
    throw new Error(
      "Não foi possível preparar o estoque para esta venda. Verifique central, limite de comodato e tente novamente."
    );
  }

  const novaPosse = disponivel - qtd;
  await tx.sellerProductStock.update({
    where: { sellerId_productId: { sellerId: vendedorId, productId } },
    data: { quantidade: novaPosse },
  });

  const seller = await tx.seller.findUniqueOrThrow({
    where: { id: vendedorId },
    select: {
      comissaoDescontaNaVenda: true,
      comissaoTipo: true,
      comissaoPercentual: true,
      comissaoPorUnidade: true,
    },
  });
  const { valorComissaoRetida, valorSaldoRepasse } = calcularRepasseVenda(
    valorTotal,
    qtd,
    seller
  );

  const venda = await tx.venda.create({
    data: {
      vendedorId,
      produtoId: productId,
      quantidade: qtd,
      quantidadeAlocadaCentral: falta,
      valorUnitario,
      valorTotal,
      valorComissaoRetida,
      valorSaldoRepasse,
      formaPagamento: formaPagamento ?? null,
      observacoes: observacoes ?? null,
    },
  });

  await tx.movimentacaoEstoque.create({
    data: {
      tipoMovimentacao: TipoMovimentacao.VENDA,
      produtoId: productId,
      vendedorId,
      quantidade: qtd,
      valorUnitario,
      valorTotal,
      observacoes: observacoes ?? null,
      usuarioResponsavelId: usuarioId,
      vendaId: venda.id,
    },
  });
}

export async function registrarVendaLote(input: {
  vendedorId: string;
  itens: Array<{
    productId: string;
    quantidade: number;
    valorUnitario: number;
    formaPagamento?: string | null;
    observacoes?: string;
  }>;
  usuarioId: string;
}) {
  const vendedorId = String(input.vendedorId ?? "").trim();
  const itens = input.itens
    .map((i) => ({
      productId: String(i.productId ?? "").trim(),
      quantidade: Math.floor(Number(i.quantidade)),
      valorUnitario: Number(i.valorUnitario),
      formaPagamento: i.formaPagamento,
      observacoes: i.observacoes,
    }))
    .filter((i) => i.productId && i.quantidade > 0);
  if (!vendedorId) throw new Error("Vendedor inválido.");
  if (itens.length === 0) throw new Error("Informe ao menos um item para venda.");

  await prisma.$transaction(async (tx) => {
    for (const item of itens) {
      await registrarVendaWithTx(tx, {
        vendedorId,
        productId: item.productId,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        formaPagamento: item.formaPagamento,
        observacoes: item.observacoes,
        usuarioId: input.usuarioId,
      });
    }
  });

  await recalcularStatusVendasVendedor(vendedorId);
}

/**
 * Consumo próprio do vendedor: baixa da posse do vendedor e gera cobrança pelo
 * custo unitário do produto (sem comissão).
 */
export async function registrarConsumoProprioVendedor(input: {
  vendedorId: string;
  productId: string;
  quantidade: number;
  observacoes?: string;
  usuarioId: string;
}) {
  const vendedorId = String(input.vendedorId ?? "").trim();
  const productId = String(input.productId ?? "").trim();
  const quantidade = Math.floor(Math.max(0, Number(input.quantidade)));
  const observacoes = String(input.observacoes ?? "").trim();
  const usuarioId = String(input.usuarioId ?? "").trim();

  if (!vendedorId || !productId || !usuarioId) {
    throw new Error("Dados inválidos para consumo próprio.");
  }
  if (!Number.isFinite(quantidade) || quantidade < 1) {
    throw new Error("Quantidade inválida.");
  }

  await prisma.$transaction(async (tx) => {
    const row = await tx.sellerProductStock.findUnique({
      where: { sellerId_productId: { sellerId: vendedorId, productId } },
      include: { product: true },
    });
    const emPosse = row?.quantidade ?? 0;
    if (!row || emPosse < quantidade) {
      throw new Error("Estoque em posse insuficiente para consumo próprio.");
    }

    await tx.sellerProductStock.update({
      where: { sellerId_productId: { sellerId: vendedorId, productId } },
      data: { quantidade: { decrement: quantidade } },
    });

    const valorUnitario = toNumber(row.product.custoUnitario);
    const valorTotal = valorUnitario * quantidade;
    const obs =
      observacoes.length > 0
        ? `[CONSUMO_PROPRIO] ${observacoes}`
        : "[CONSUMO_PROPRIO]";

    const venda = await tx.venda.create({
      data: {
        vendedorId,
        produtoId: productId,
        quantidade,
        quantidadeAlocadaCentral: 0,
        valorUnitario,
        valorTotal,
        valorComissaoRetida: 0,
        valorSaldoRepasse: valorTotal,
        formaPagamento: "CONSUMO_PROPRIO",
        observacoes: obs,
      },
    });

    await tx.movimentacaoEstoque.create({
      data: {
        tipoMovimentacao: TipoMovimentacao.VENDA,
        produtoId: productId,
        vendedorId,
        quantidade,
        valorUnitario,
        valorTotal,
        observacoes: obs,
        usuarioResponsavelId: usuarioId,
        vendaId: venda.id,
      },
    });
  });

  await recalcularStatusVendasVendedor(vendedorId);
}

/**
 * Remove o registro da venda e devolve o estoque (posse do vendedor + central
 * conforme a alocação gravada em `quantidadeAlocadaCentral`).
 * Vendas antigas com alocação 0 podem precisar de ajuste manual do central.
 */
export async function estornarVenda(input: { vendaId: string; usuarioId: string }) {
  const { vendaId, usuarioId } = input;

  const aplicadoFifo = await calcularMontanteRepasseCobertoFifoForVenda(
    (
      await prisma.venda.findUniqueOrThrow({
        where: { id: vendaId },
        select: { vendedorId: true },
      })
    ).vendedorId,
    vendaId
  );

  let vendedorIdParaRecalc = "";
  await prisma.$transaction(async (tx) => {
    const venda = await tx.venda.findUniqueOrThrow({
      where: { id: vendaId },
    });
    vendedorIdParaRecalc = venda.vendedorId;

    const {
      vendedorId,
      produtoId,
      quantidade,
      quantidadeAlocadaCentral,
      valorUnitario,
      valorTotal,
    } = venda;
    const falta = quantidadeAlocadaCentral;
    const voltaPosse = quantidade - falta;

    if (voltaPosse > 0) {
      await ensureSellerStockWithTx(tx, vendedorId, produtoId);
      await tx.sellerProductStock.update({
        where: {
          sellerId_productId: { sellerId: vendedorId, productId: produtoId },
        },
        data: { quantidade: { increment: voltaPosse } },
      });
    }
    if (falta > 0) {
      await tx.product.update({
        where: { id: produtoId },
        data: { estoqueCentral: { increment: falta } },
      });
    }

    // INSERT em SQL: o validador do Prisma Client pode rejeitar ESTORNO_VENDA se o
    // generate estiver desatualizado; a base já tem o valor no enum.
    const obsEstorno = `Estorno da venda ${vendaId}.`;
    const movId = randomUUID();
    await tx.$executeRaw`
      INSERT INTO "MovimentacaoEstoque" (
        "id",
        "tipoMovimentacao",
        "produtoId",
        "vendedorId",
        "quantidade",
        "valorUnitario",
        "valorTotal",
        "observacoes",
        "usuarioResponsavelId",
        "createdAt",
        "vendaId"
      ) VALUES (
        ${movId},
        'ESTORNO_VENDA'::"TipoMovimentacao",
        ${produtoId},
        ${vendedorId},
        ${quantidade},
        ${valorUnitario},
        ${valorTotal},
        ${obsEstorno},
        ${usuarioId},
        NOW(),
        NULL
      )
    `;

    if (aplicadoFifo > 0) {
      await tx.recebimento.create({
        data: {
          vendedorId,
          valorRecebido: -aplicadoFifo,
          formaPagamento: "Ajuste (estorno de venda)",
          observacoes: `Libera cobertura de recebimentos da venda estornada (${vendaId}).`,
        },
      });
    }

    await tx.venda.delete({ where: { id: vendaId } });
  });

  await recalcularStatusVendasVendedor(vendedorIdParaRecalc);
}

export async function registrarRecebimento(input: {
  vendedorId: string;
  valorRecebido: number;
  formaPagamento: string;
  observacoes?: string;
  dataRecebimento?: Date;
}) {
  const { vendedorId, valorRecebido, formaPagamento, observacoes, dataRecebimento } = input;
  if (valorRecebido <= 0) throw new Error("Valor recebido inválido.");
  if (dataRecebimento && Number.isNaN(dataRecebimento.getTime())) {
    throw new Error("Data de recebimento inválida.");
  }

  await prisma.recebimento.create({
    data: {
      vendedorId,
      valorRecebido,
      formaPagamento,
      observacoes: observacoes ?? null,
      ...(dataRecebimento ? { createdAt: dataRecebimento } : {}),
    },
  });

  await recalcularStatusVendasVendedor(vendedorId);
}
