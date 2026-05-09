import Papa from "papaparse";
import type { Product } from "@/types";

export const PRODUCT_CSV_HEADERS = [
  "id",
  "name",
  "description",
  "price",
  "costPrice",
  "category",
  "imageUrlId",
  "stock_quantity",
  "isActive",
  "preparationTime",
  "laborCost",
  "fixedCost",
  "components_json",
] as const;

export type ProductCsvHeader = (typeof PRODUCT_CSV_HEADERS)[number];

/** Documentação das colunas correspondentes à tabela `public.products` no Supabase */
export const PRODUCT_CSV_COLUMN_DOCS: Array<{
  key: ProductCsvHeader;
  required: boolean;
  dbColumn: string;
  notes: string;
}> = [
  { key: "id", required: false, dbColumn: 'id (uuid)', notes: "Deixe vazio para criar um produto novo. Preencha para atualizar um produto existente do seu tenant." },
  { key: "name", required: true, dbColumn: "name", notes: "Nome de venda do produto." },
  { key: "description", required: false, dbColumn: "description", notes: "Texto livre; use aspas no CSV se houver vírgulas." },
  { key: "price", required: true, dbColumn: "price", notes: "Preço de venda. Use ponto como decimal (ex.: 29.90)." },
  { key: "costPrice", required: false, dbColumn: '"costPrice"', notes: "Custo; padrão 0 se vazio." },
  { key: "category", required: false, dbColumn: "category", notes: "Categoria exibida no catálogo/PdV." },
  { key: "imageUrlId", required: false, dbColumn: '"imageUrlId"', notes: "Identificador ou URL de imagem já usada pelo app." },
  { key: "stock_quantity", required: false, dbColumn: "stock_quantity", notes: "Quantidade em estoque inteira; padrão 0." },
  { key: "isActive", required: false, dbColumn: '"isActive"', notes: "true/false, 1/0, sim/não. Padrão true." },
  { key: "preparationTime", required: false, dbColumn: '"preparationTime"', notes: "Tempo de preparo em minutos (inteiro) ou vazio." },
  { key: "laborCost", required: false, dbColumn: '"laborCost"', notes: "Custo de mão de obra por unidade; padrão 0." },
  { key: "fixedCost", required: false, dbColumn: '"fixedCost"', notes: "Rateio de custo fixo; padrão 0." },
  {
    key: "components_json",
    required: false,
    dbColumn: "components (jsonb)",
    notes: 'JSON de componentes da ficha técnica. Ex.: [{"componentId":"uuid","componentName":"Farinha","componentType":"supply","quantity":0.5,"unit":"kg"}]. Vazio = sem componentes.',
  },
];

export type ProductCsvImportRow = {
  sourceRowIndex: number;
  id?: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  category: string;
  imageUrlId: string;
  stock_quantity: number;
  isActive: boolean;
  preparationTime: number | null;
  laborCost: number;
  fixedCost: number;
  components: unknown[] | null;
};

function parseFlexibleNumber(raw: string, field: string): number {
  const s = raw.trim();
  if (!s) throw new Error(`${field} não pode estar vazio`);
  let normalized = s.replace(/R\$\s?/i, "").trim();
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",") && !normalized.includes(".")) {
    normalized = normalized.replace(",", ".");
  }
  const n = Number(normalized);
  if (Number.isNaN(n)) throw new Error(`${field} não é um número válido (${raw})`);
  return n;
}

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw === null) return defaultValue;
  const t = String(raw).trim().toLowerCase();
  if (t === "") return defaultValue;
  if (["false", "0", "não", "nao", "inativo", "no"].includes(t)) return false;
  if (["true", "1", "sim", "ativo", "yes"].includes(t)) return true;
  return defaultValue;
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

function normalizeHeaderKey(h: string): string {
  return h.replace(/^\ufeff/, "").trim();
}

export function serializeProductsToCsv(products: Product[]): string {
  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    price: p.price,
    costPrice: p.costPrice ?? 0,
    category: p.category ?? "",
    imageUrlId: p.imageUrlId ?? "",
    stock_quantity: p.stock_quantity ?? 0,
    isActive: p.isActive !== false,
    preparationTime: p.preparationTime ?? "",
    laborCost: p.laborCost ?? 0,
    fixedCost: p.fixedCost ?? 0,
    components_json: JSON.stringify(p.components ?? []),
  }));

  return Papa.unparse(rows, {
    columns: [...PRODUCT_CSV_HEADERS],
    header: true,
  });
}

export function serializeProductCsvTemplate(): string {
  return Papa.unparse([{}], {
    columns: [...PRODUCT_CSV_HEADERS],
    header: true,
  });
}

export type ProductCsvParseResult =
  | { ok: true; rows: ProductCsvImportRow[] }
  | { ok: false; errors: string[] };

export function parseProductsCsv(text: string): ProductCsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => normalizeHeaderKey(h),
  });

  if (parsed.errors?.length) {
    const msg = parsed.errors.map((e) => e.message).join("; ");
    return { ok: false, errors: [`Erro ao ler CSV: ${msg}`] };
  }

  const fields = parsed.meta.fields?.map(normalizeHeaderKey) ?? [];
  const missing = PRODUCT_CSV_HEADERS.filter((h) => !fields.includes(h));
  if (missing.length) {
    return {
      ok: false,
      errors: [
        `Cabeçalhos obrigatórios ausentes: ${missing.join(", ")}. Use o modelo exportado pela aplicação.`,
      ],
    };
  }

  const data = parsed.data ?? [];
  const errors: string[] = [];
  const rows: ProductCsvImportRow[] = [];

  data.forEach((record, idx) => {
    const sourceRowIndex = idx + 2;
    try {
      const idRaw = record.id?.trim() ?? "";
      const id = idRaw ? (isUuid(idRaw) ? idRaw : (() => { throw new Error(`id inválido (use UUID vazio para novo): ${idRaw}`); })()) : undefined;

      const name = (record.name ?? "").trim();
      if (!name) throw new Error("name é obrigatório");

      const description = (record.description ?? "").trim();
      const price = parseFlexibleNumber(String(record.price ?? ""), "price");
      const costPriceRaw = String(record.costPrice ?? "").trim();
      const costPrice = costPriceRaw === "" ? 0 : parseFlexibleNumber(costPriceRaw, "costPrice");

      const category = (record.category ?? "").trim();
      const imageUrlId = (record.imageUrlId ?? "").trim();
      const stockRaw = String(record.stock_quantity ?? "").trim();
      const stock_quantity = stockRaw === "" ? 0 : Math.round(parseFlexibleNumber(stockRaw, "stock_quantity"));

      const isActive = parseBool(record.isActive, true);

      const prepRaw = String(record.preparationTime ?? "").trim();
      const preparationTime = prepRaw === "" ? null : Math.round(parseFlexibleNumber(prepRaw, "preparationTime"));

      const laborRaw = String(record.laborCost ?? "").trim();
      const laborCost = laborRaw === "" ? 0 : parseFlexibleNumber(laborRaw, "laborCost");

      const fixedRaw = String(record.fixedCost ?? "").trim();
      const fixedCost = fixedRaw === "" ? 0 : parseFlexibleNumber(fixedRaw, "fixedCost");

      const compRaw = (record.components_json ?? "").trim();
      let components: unknown[] | null = null;
      if (compRaw) {
        try {
          const parsedJson = JSON.parse(compRaw);
          if (!Array.isArray(parsedJson)) throw new Error("components_json deve ser um array JSON");
          components = parsedJson;
        } catch {
          throw new Error("components_json não é um JSON válido");
        }
      }

      rows.push({
        sourceRowIndex,
        id,
        name,
        description,
        price,
        costPrice,
        category,
        imageUrlId,
        stock_quantity,
        isActive,
        preparationTime,
        laborCost,
        fixedCost,
        components,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(`Linha ${sourceRowIndex}: ${message}`);
    }
  });

  if (errors.length) return { ok: false, errors };
  return { ok: true, rows };
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\ufeff" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
