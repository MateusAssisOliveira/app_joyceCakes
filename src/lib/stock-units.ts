/**
 * Estoque de produto em menor unidade inteira (sem decimais no banco).
 * Base: g | ml | un — exibição pode usar kg/L/rótulo via display_unit.
 */

export const STOCK_UNIT_TYPES = ["g", "ml", "un"] as const;
export type StockUnitType = (typeof STOCK_UNIT_TYPES)[number];

export function isStockUnitType(value: unknown): value is StockUnitType {
  return typeof value === "string" && (STOCK_UNIT_TYPES as readonly string[]).includes(value);
}

/** Valores legados ou inválidos viram `un` para não alterar quantidades existentes. */
export function normalizeStockUnitType(value: unknown): StockUnitType {
  if (typeof value !== "string") return "un";
  const v = value.trim().toLowerCase();
  if (v === "g" || v === "ml" || v === "un") return v;
  return "un";
}

function isMlDisplayLiter(displayUnit: string): boolean {
  const d = displayUnit.trim().toLowerCase();
  return d === "l" || d === "litro" || d === "litros";
}

/** Fator para converter valor digitado na UI (kg, L, …) para unidade base inteira. */
export function displayUnitToBaseMultiplier(displayUnit: string | null | undefined, unitType: StockUnitType): number {
  const raw = typeof displayUnit === "string" ? displayUnit : "";
  const d = raw.trim().toLowerCase();
  if (unitType === "g") {
    if (d === "kg") return 1000;
    return 1;
  }
  if (unitType === "ml") {
    if (isMlDisplayLiter(raw)) return 1000;
    return 1;
  }
  return 1;
}

export function parseDisplayQuantityToBaseInteger(
  displayQty: number,
  displayUnit: string | null | undefined,
  unitType: StockUnitType
): number {
  if (!Number.isFinite(displayQty) || displayQty < 0) return 0;
  const mult = displayUnitToBaseMultiplier(displayUnit, unitType);
  return Math.round(displayQty * mult);
}

/** Quantidade base → número mostrado no campo de formulário (pode ser fracionário para kg/L). */
export function baseQuantityToDisplayNumeric(
  baseQty: number,
  unitType: StockUnitType,
  displayUnit: string | null | undefined
): number {
  const safe = Math.max(0, Math.round(Number(baseQty) || 0));
  const raw = typeof displayUnit === "string" ? displayUnit : "";
  if (unitType === "g" && raw.trim().toLowerCase() === "kg") return safe / 1000;
  if (unitType === "ml" && isMlDisplayLiter(raw)) return safe / 1000;
  return safe;
}

export function validateDisplayUnitForType(displayUnit: string | null | undefined, unitType: StockUnitType): boolean {
  const d = (displayUnit ?? "").trim();
  if (!d) return true;
  const lower = d.toLowerCase();
  if (unitType === "g") return lower === "g" || lower === "kg";
  if (unitType === "ml") return lower === "ml" || isMlDisplayLiter(d);
  return d.length <= 32;
}

/**
 * Normaliza o que vai para o banco: g/ml em rótulos canônicos; unitário preserva rótulo curto.
 */
/** Separa o que veio do banco em escala (kg/L) vs rótulo livre (unitário). */
export function splitProductDisplayFields(
  unitType: StockUnitType,
  displayUnit: string | null | undefined
): { scale: "" | "kg" | "L"; unitLabel: string } {
  if (unitType === "un") {
    return { scale: "", unitLabel: displayUnit?.trim() ?? "" };
  }
  const raw = displayUnit ?? "";
  const lower = raw.trim().toLowerCase();
  if (unitType === "g" && lower === "kg") return { scale: "kg", unitLabel: "" };
  if (unitType === "ml" && isMlDisplayLiter(raw)) return { scale: "L", unitLabel: "" };
  return { scale: "", unitLabel: "" };
}

/** Monta display_unit a partir dos campos do formulário. */
export function mergeProductDisplayFields(
  unitType: StockUnitType,
  scale: "" | "kg" | "L",
  unitLabel: string
): string | null {
  if (unitType === "un") {
    return normalizeDisplayUnitForStorage(unitLabel.trim() || null, "un");
  }
  const raw = scale === "kg" || scale === "L" ? scale : null;
  return normalizeDisplayUnitForStorage(raw, unitType);
}

export function normalizeDisplayUnitForStorage(
  displayUnit: string | null | undefined,
  unitType: StockUnitType
): string | null {
  const d = (displayUnit ?? "").trim();
  if (!d) return null;
  if (unitType === "g") {
    const lower = d.toLowerCase();
    if (lower === "kg") return "kg";
    return "g";
  }
  if (unitType === "ml") {
    const lower = d.toLowerCase();
    if (lower === "l" || lower === "litro" || lower === "litros") return "L";
    return "ml";
  }
  return d.length > 32 ? d.slice(0, 32) : d;
}

export type FormattedStockDisplay = {
  primaryValue: number;
  primarySuffix: string;
  secondaryHint?: string;
};

function formatQtyReadable(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return n.toLocaleString("pt-BR");
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 6 });
}

/** Texto amigável para listagens e mensagens (ex.: "5 kg", "2 L", "50 caixas"). */
export function formatBaseStockForDisplay(
  baseQty: number,
  unitType: StockUnitType,
  displayUnit: string | null | undefined
): FormattedStockDisplay {
  const safe = Math.max(0, Math.round(Number(baseQty) || 0));

  if (unitType === "un") {
    const suffix = (displayUnit?.trim()) || "un";
    return { primaryValue: safe, primarySuffix: suffix };
  }

  const raw = typeof displayUnit === "string" ? displayUnit : "";
  const lower = raw.trim().toLowerCase();

  if (unitType === "g") {
    if (lower === "kg") {
      return {
        primaryValue: safe / 1000,
        primarySuffix: "kg",
        secondaryHint: `${safe.toLocaleString("pt-BR")} g`,
      };
    }
    return { primaryValue: safe, primarySuffix: "g" };
  }

  if (unitType === "ml") {
    if (isMlDisplayLiter(raw)) {
      return {
        primaryValue: safe / 1000,
        primarySuffix: "L",
        secondaryHint: `${safe.toLocaleString("pt-BR")} ml`,
      };
    }
    return { primaryValue: safe, primarySuffix: "ml" };
  }

  return { primaryValue: safe, primarySuffix: unitType };
}

export function stockQuantityLabel(product: {
  stock_quantity?: number;
  unit_type?: unknown;
  display_unit?: unknown;
}): string {
  const base = Math.max(0, Math.round(Number(product.stock_quantity ?? 0)));
  const ut = normalizeStockUnitType(product.unit_type);
  const du = typeof product.display_unit === "string" ? product.display_unit : null;
  const { primaryValue, primarySuffix, secondaryHint } = formatBaseStockForDisplay(base, ut, du);
  const main = `${formatQtyReadable(primaryValue)} ${primarySuffix}`.trim();
  return secondaryHint ? `${main} (${secondaryHint})` : main;
}

export function formatStockQuantityInputFromNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return String(Math.round(n));
  const rounded = Math.round(n * 1e6) / 1e6;
  return String(rounded);
}
