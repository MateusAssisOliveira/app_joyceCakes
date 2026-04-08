const fs = require("fs");
const path = require("path");

function splitTuples(valuesBlock) {
  const tuples = [];
  let current = "";
  let depth = 0;
  let inQuote = false;
  let prev = "";
  let capturing = false;

  for (const ch of valuesBlock) {
    if (ch === "'" && prev !== "\\") inQuote = !inQuote;
    if (!inQuote && ch === "(") {
      if (depth === 0) {
        current = "";
        capturing = true;
      }
      depth += 1;
    }
    if (capturing) current += ch;
    if (!inQuote && ch === ")" && depth > 0) {
      depth -= 1;
      if (depth === 0 && capturing) {
        tuples.push(current.trim());
        current = "";
        capturing = false;
      }
    }
    prev = ch;
  }
  return tuples;
}

function parseTuple(tuple) {
  const s = tuple.trim().replace(/^\(/, "").replace(/\)$/, "");
  const out = [];
  let cur = "";
  let inQuote = false;
  let prev = "";
  for (const ch of s) {
    if (ch === "'" && prev !== "\\") inQuote = !inQuote;
    if (ch === "," && !inQuote) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
    prev = ch;
  }
  if (cur.length > 0) out.push(cur.trim());
  return out.map((v) => {
    if (/^null$/i.test(v)) return null;
    if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/\\'/g, "'");
    const num = Number(v);
    return Number.isFinite(num) ? num : v;
  });
}

function getInsertValues(sql, tableName, expectedCols) {
  const re = new RegExp(`INSERT INTO\\s+\\b${tableName}\\b\\s*\\([^)]*\\)\\s*VALUES\\s*([\\s\\S]*?);`, "gi");
  const blocks = [];
  let m;
  while ((m = re.exec(sql)) !== null) {
    blocks.push(m[1]);
  }
  const rows = blocks.flatMap(splitTuples).map(parseTuple);
  if (!expectedCols) return rows;
  return rows.filter((r) => Array.isArray(r) && r.length === expectedCols);
}

function main() {
  const input = process.argv[2] || "backups/receitas_produtos_legacy.sql";
  const output = process.argv[3] || "backups/receitas-extraidas.json";
  const absIn = path.resolve(process.cwd(), input);
  const absOut = path.resolve(process.cwd(), output);
  if (!fs.existsSync(absIn)) throw new Error(`Arquivo nao encontrado: ${absIn}`);

  const sql = fs.readFileSync(absIn, "utf8");
  const produtosRows = getInsertValues(sql, "produtos", 5);
  const receitasRows = getInsertValues(sql, "receitas", 8);
  const receitasProdutosRows = getInsertValues(sql, "receitas_produtos", 5);

  const produtosById = new Map();
  produtosRows.forEach((row, i) => {
    const id = i + 1;
    produtosById.set(id, {
      id: `legacy-prod-${id}`,
      name: String(row[0] || `Produto ${id}`),
      unit: String(row[3] || "un"),
      costPerUnit: Number(row[4] || 0),
    });
  });

  const receitasById = new Map();
  receitasRows.forEach((row, i) => {
    const id = i + 1;
    receitasById.set(id, {
      id: `legacy-recipe-${id}`,
      name: String(row[0] || `Receita ${id}`),
      description: String(row[1] || ""),
      type: "base",
      steps: String(row[3] || ""),
      preparationTime: Number(row[4] || 0),
      yield: String(row[5] || ""),
      components: [],
      totalCost: 0,
      suggestedPrice: 0,
      laborCost: 0,
      fixedCost: 0,
      isActive: true,
    });
  });

  receitasProdutosRows.forEach((row) => {
    const receitaId = Number(row[0] || 0);
    const produtoId = Number(row[1] || 0);
    const quantidade = Number(row[2] || 0);
    const observacoes = row[4] ? String(row[4]) : "";
    const receita = receitasById.get(receitaId);
    const produto = produtosById.get(produtoId);
    if (!receita || !produto) return;

    receita.components.push({
      componentId: produto.id,
      componentName: observacoes || produto.name,
      componentType: "supply",
      quantity: quantidade,
      unit: "un",
    });
    receita.totalCost += quantidade * (produto.costPerUnit || 0);
  });

  const recipes = Array.from(receitasById.values()).map((r) => ({
    ...r,
    totalCost: Number(r.totalCost.toFixed(2)),
    suggestedPrice: Number((r.totalCost * 2.3).toFixed(2)),
  }));

  fs.writeFileSync(absOut, JSON.stringify(recipes, null, 2), "utf8");
  console.log(`[extract-recipes] input=${input} receitas=${recipes.length} output=${output}`);
}

try {
  main();
} catch (err) {
  console.error("[extract-recipes] erro:", err && err.message ? err.message : err);
  process.exit(1);
}
