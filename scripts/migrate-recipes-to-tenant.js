const fs = require("fs");
const path = require("path");
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const {
  getFirestore,
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
} = require("firebase/firestore");

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
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return fallback;
}

function removeUndefinedFields(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function normalizeSheet(data, tenantId) {
  return removeUndefinedFields({
    name: toStringValue(data.name, "Receita sem nome"),
    description: toStringValue(data.description, ""),
    type: toStringValue(data.type, "base"),
    components: Array.isArray(data.components) ? data.components : [],
    steps: toStringValue(data.steps, ""),
    yield: toStringValue(data.yield, ""),
    totalCost: toNumber(data.totalCost ?? data.totalcost, 0),
    suggestedPrice: toNumber(data.suggestedPrice ?? data.suggestedprice, 0),
    preparationTime: toNumber(data.preparationTime ?? data.preparationtime, 0),
    laborCost: toNumber(data.laborCost ?? data.laborcost, 0),
    fixedCost: toNumber(data.fixedCost ?? data.fixedcost, 0),
    isActive: toBoolean(data.isActive ?? data.isactive, true),
    tenantId,
    migratedAt: serverTimestamp(),
  });
}

async function readCollectionSafe(db, path) {
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
  } catch {
    return [];
  }
}

async function main() {
  loadDotEnvFile();
  const email = process.argv[2] || process.env.NEXT_PUBLIC_DEFAULT_LOGIN_EMAIL;
  const password = process.argv[3] || process.env.NEXT_PUBLIC_DEFAULT_LOGIN_PASSWORD || "senha123";
  const tenantIdArg = process.argv[4] || "ewM6EBD7uAZAJ3rGcH05spi7H3t2";
  if (!email) {
    throw new Error("Informe email: node scripts/migrate-recipes-to-tenant.js <email> <senha> <tenantId>");
  }

  const app = initializeApp(getFirebaseConfig());
  const auth = getAuth(app);
  const db = getFirestore(app);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  const tenantId = tenantIdArg || uid;

  const sourcePaths = [
    "technical_sheets",
    "technicalSheets",
    "recipes",
    `users/${uid}/technical_sheets`,
    `users/${uid}/technicalSheets`,
    `users/${uid}/recipes`,
  ];

  const byId = new Map();
  for (const path of sourcePaths) {
    const docs = await readCollectionSafe(db, path);
    if (docs.length > 0) {
      console.log(`[recipes-migration] origem ${path}: ${docs.length}`);
    }
    for (const item of docs) {
      if (!byId.has(item.id)) {
        byId.set(item.id, item.data);
      }
    }
  }

  const all = Array.from(byId.entries()).map(([id, data]) => ({ id, data }));
  if (all.length === 0) {
    console.log("[recipes-migration] nenhuma receita encontrada nas colecoes legadas.");
    return;
  }

  let written = 0;
  for (let i = 0; i < all.length; i += 400) {
    const chunk = all.slice(i, i + 400);
    const batch = writeBatch(db);
    for (const item of chunk) {
      const ref = doc(db, `tenants/${tenantId}/technical_sheets`, item.id);
      batch.set(ref, normalizeSheet(item.data, tenantId), { merge: true });
      written += 1;
    }
    await batch.commit();
  }

  console.log(`[recipes-migration] tenant=${tenantId} receitas_migradas=${written}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("[recipes-migration] erro:", err && err.message ? err.message : err);
    process.exit(1);
  });
