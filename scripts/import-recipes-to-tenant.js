const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, writeBatch, serverTimestamp } = require("firebase/firestore");

function loadDotEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().length === 0 || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  };
}

function toStringValue(value, fallback = "") {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
    if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") return false;
  }
  return fallback;
}

function parseMaybeJson(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function cleanObject(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function normalizeRecipe(raw, tenantId) {
  const id = toStringValue(raw.id, "").trim();
  const payload = cleanObject({
    name: toStringValue(raw.name, "Receita sem nome"),
    description: toStringValue(raw.description, ""),
    type: toStringValue(raw.type, "base"),
    components: Array.isArray(raw.components) ? raw.components : parseMaybeJson(raw.components, []),
    steps: toStringValue(raw.steps, ""),
    yield: toStringValue(raw.yield, ""),
    totalCost: toNumber(raw.totalCost ?? raw.totalcost, 0),
    suggestedPrice: toNumber(raw.suggestedPrice ?? raw.suggestedprice, 0),
    preparationTime: toNumber(raw.preparationTime ?? raw.preparationtime, 0),
    laborCost: toNumber(raw.laborCost ?? raw.laborcost, 0),
    fixedCost: toNumber(raw.fixedCost ?? raw.fixedcost, 0),
    isActive: toBoolean(raw.isActive ?? raw.isactive, true),
    tenantId,
    importedAt: serverTimestamp(),
  });
  return { id, payload };
}

function loadInputFile(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Arquivo nao encontrado: ${abs}`);
  }

  const ext = path.extname(abs).toLowerCase();
  const content = fs.readFileSync(abs, "utf8");

  if (ext === ".json") {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.recipes)) return parsed.recipes;
    throw new Error("JSON invalido. Use um array ou { recipes: [] }");
  }

  if (ext === ".csv") {
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
    if (parsed.errors && parsed.errors.length > 0) {
      const first = parsed.errors[0];
      throw new Error(`Erro CSV na linha ${first.row}: ${first.message}`);
    }
    return parsed.data || [];
  }

  throw new Error("Formato nao suportado. Use .json ou .csv");
}

async function main() {
  loadDotEnvFile();

  const filePath = process.argv[2];
  const tenantId = process.argv[3];
  const email = process.argv[4] || process.env.NEXT_PUBLIC_DEFAULT_LOGIN_EMAIL;
  const password = process.argv[5];

  if (!filePath || !tenantId || !email || !password) {
    throw new Error(
      "Uso: node scripts/import-recipes-to-tenant.js <arquivo.json|arquivo.csv> <tenantId> <email> <senha>"
    );
  }

  const records = loadInputFile(filePath);
  if (!Array.isArray(records) || records.length === 0) {
    console.log("[recipes-import] arquivo sem receitas.");
    return;
  }

  const app = initializeApp(getFirebaseConfig());
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInWithEmailAndPassword(auth, email, password);

  let imported = 0;
  for (let i = 0; i < records.length; i += 400) {
    const chunk = records.slice(i, i + 400);
    const batch = writeBatch(db);
    for (let j = 0; j < chunk.length; j++) {
      const raw = chunk[j] || {};
      const { id, payload } = normalizeRecipe(raw, tenantId);
      const finalId = id || `imported_${Date.now()}_${i + j}`;
      const ref = doc(db, `tenants/${tenantId}/technical_sheets`, finalId);
      batch.set(ref, payload, { merge: true });
      imported += 1;
    }
    await batch.commit();
  }

  console.log(`[recipes-import] tenant=${tenantId} receitas_importadas=${imported}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[recipes-import] erro:", err && err.message ? err.message : err);
    process.exit(1);
  });
