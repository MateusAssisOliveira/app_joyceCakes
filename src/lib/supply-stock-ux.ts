import type { Supply } from "@/types";

/** Menor unidade de armazenamento para insumos (sem kg/L no cadastro novo). */
export type SupplyContentUnit = "g" | "ml" | "un";

export type SupplyHumanStockSplit = {
  stockPurchaseQty: number;
  minStockPurchaseQty: number;
  contentPerPurchase: number;
  contentUnit: SupplyContentUnit;
  purchaseFormat: NonNullable<Supply["purchaseFormat"]>;
};

export function supplyUnitToContentUnit(unit: Supply["unit"]): SupplyContentUnit {
  if (unit === "kg" || unit === "g") return "g";
  if (unit === "L" || unit === "ml") return "ml";
  return "un";
}

/** Converte quantidade armazenada para inteiro na base g / ml / un. */
export function supplyStockToBaseQuantity(raw: number, unit: Supply["unit"]): number {
  const n = Number(raw) || 0;
  if (unit === "kg") return Math.round(n * 1000);
  if (unit === "L") return Math.round(n * 1000);
  return Math.round(n);
}

export function purchaseFormatLabel(format: Supply["purchaseFormat"]): string {
  switch (format) {
    case "caixa":
      return "caixa";
    case "pacote":
      return "pacote";
    case "lata":
      return "lata";
    case "garrafa":
      return "garrafa";
    case "saco":
      return "saco";
    case "frasco":
      return "frasco";
    case "unidade":
      return "unidade";
    default:
      return "embalagem";
  }
}

/** Deriva campos “humanos” a partir do registro salvo (compatível com kg/L antigos). */
export function splitSupplyStockForUX(supply: Supply): SupplyHumanStockSplit {
  const fmt = supply.purchaseFormat || "unidade";
  const contentUnit = supplyUnitToContentUnit(supply.unit);
  const baseStock = supplyStockToBaseQuantity(supply.stock, supply.unit);
  const baseMin = supplyStockToBaseQuantity(supply.minStock ?? 0, supply.unit);
  const pkg =
    supply.packageQuantity !== undefined && supply.packageQuantity !== null && supply.packageQuantity > 0
      ? Number(supply.packageQuantity)
      : 1;

  if (fmt === "unidade") {
    if (contentUnit === "un") {
      return {
        stockPurchaseQty: Number(supply.stock) || 0,
        minStockPurchaseQty: Number(supply.minStock ?? 0) || 0,
        contentPerPurchase: 1,
        contentUnit,
        purchaseFormat: fmt,
      };
    }
    return {
      stockPurchaseQty: baseStock,
      minStockPurchaseQty: baseMin,
      contentPerPurchase: 1,
      contentUnit,
      purchaseFormat: fmt,
    };
  }

  return {
    stockPurchaseQty: baseStock / pkg,
    minStockPurchaseQty: baseMin / pkg,
    contentPerPurchase: pkg,
    contentUnit,
    purchaseFormat: fmt,
  };
}

export type DerivedSupplyQuantities =
  | {
      stock: number;
      minStock: number;
      unit: SupplyContentUnit;
      packageQuantity: number | undefined;
    }
  | { error: string };

/**
 * Converte entradas humanas para o que vai ao Supabase (menor unidade + packageQuantity quando aplicável).
 */
export function deriveSupplyQuantitiesForSave(params: {
  purchaseFormat: Supply["purchaseFormat"];
  contentUnit: SupplyContentUnit;
  contentPerPurchase: number;
  stockPurchaseQty: number;
  minStockPurchaseQty: number;
}): DerivedSupplyQuantities {
  const { purchaseFormat, contentUnit, contentPerPurchase, stockPurchaseQty, minStockPurchaseQty } = params;

  if (purchaseFormat === "unidade") {
    if (contentUnit === "un") {
      const stock = Math.max(0, Math.round(stockPurchaseQty));
      const minStock = Math.max(0, Math.round(minStockPurchaseQty));
      return { stock, minStock, unit: "un", packageQuantity: undefined };
    }
    const stock = Math.max(0, Math.round(stockPurchaseQty));
    const minStock = Math.max(0, Math.round(minStockPurchaseQty));
    return { stock, minStock, unit: contentUnit, packageQuantity: undefined };
  }

  const per = Number(contentPerPurchase);
  if (!Number.isFinite(per) || per <= 0) {
    return { error: "Informe o conteúdo por embalagem (maior que zero)." };
  }

  const stock = Math.max(0, Math.round(stockPurchaseQty * per));
  const minStock = Math.max(0, Math.round(minStockPurchaseQty * per));

  return {
    stock,
    minStock,
    unit: contentUnit,
    packageQuantity: per,
  };
}

export function formatBaseStockHint(unit: SupplyContentUnit, quantity: number): string {
  const q = Math.max(0, Math.round(quantity));
  if (unit === "g") return `${q.toLocaleString("pt-BR")} g`;
  if (unit === "ml") return `${q.toLocaleString("pt-BR")} ml`;
  return `${q.toLocaleString("pt-BR")} un`;
}
