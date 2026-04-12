import { ComissaoVendedorTipo, type Seller } from "@prisma/client";

type SellerComissaoFields = Pick<
  Seller,
  | "comissaoDescontaNaVenda"
  | "comissaoTipo"
  | "comissaoPercentual"
  | "comissaoPorUnidade"
>;

/**
 * Calcula comissão retida na venda e o saldo líquido a repassar à empresa.
 */
export function calcularRepasseVenda(
  valorTotalBruto: number,
  quantidade: number,
  seller: SellerComissaoFields
): { valorComissaoRetida: number; valorSaldoRepasse: number } {
  if (
    !seller.comissaoDescontaNaVenda ||
    seller.comissaoTipo === ComissaoVendedorTipo.NENHUMA
  ) {
    return { valorComissaoRetida: 0, valorSaldoRepasse: valorTotalBruto };
  }

  let comissao = 0;
  if (seller.comissaoTipo === ComissaoVendedorTipo.PERCENTUAL_SOBRE_VENDA) {
    const p =
      seller.comissaoPercentual != null
        ? Number(seller.comissaoPercentual)
        : 0;
    comissao = Math.round(((valorTotalBruto * p) / 100) * 100) / 100;
  } else if (seller.comissaoTipo === ComissaoVendedorTipo.FIXA_POR_UNIDADE) {
    const u =
      seller.comissaoPorUnidade != null
        ? Number(seller.comissaoPorUnidade)
        : 0;
    comissao = Math.round(u * quantidade * 100) / 100;
  }

  comissao = Math.min(Math.max(0, comissao), valorTotalBruto);
  const saldo =
    Math.round((valorTotalBruto - comissao) * 100) / 100;
  return { valorComissaoRetida: comissao, valorSaldoRepasse: saldo };
}
