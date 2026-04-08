const fs = require("fs");
const path = require("path");
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

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
    if (!process.env[key]) process.env[key] = value;
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

function toDateIso(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof value === "object" && typeof value.toDate === "function") {
    try {
      const d = value.toDate();
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeRecord(id, raw, tenantId) {
  const componentsArray = Array.isArray(raw.components) ? raw.components : [];
  return {
    id,
    tenantId,
    name: raw.name || "Receita",
    description: raw.description || "",
    type: raw.type || "base",
    components: JSON.stringify(componentsArray),
    steps: raw.steps || "",
    yield: raw.yield || "",
    totalCost: Number(raw.totalCost ?? raw.totalcost ?? 0) || 0,
    suggestedPrice: Number(raw.suggestedPrice ?? raw.suggestedprice ?? 0) || 0,
    preparationTime: Number(raw.preparationTime ?? raw.preparationtime ?? 0) || 0,
    laborCost: Number(raw.laborCost ?? raw.laborcost ?? 0) || 0,
    fixedCost: Number(raw.fixedCost ?? raw.fixedcost ?? 0) || 0,
    isActive: raw.isActive !== false && raw.isactive !== false,
    updatedAt:
      toDateIso(raw.updatedAt) ||
      toDateIso(raw.updated_at) ||
      toDateIso(raw.createdAt) ||
      toDateIso(raw.created_at) ||
      new Date().toISOString(),
  };
}

async function postSyncChunk(syncServer, apiKey, tenantId, machineId, chunk) {
  const headers = { "Content-Type": "application/json", "x-tenant-id": tenantId };
  if (apiKey) headers["x-api-key"] = apiKey;

  const response = await fetch(`${syncServer}/api/sync/technical_sheets`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      machineId,
      tenantId,
      localUpdates: chunk,
    }),
  });

  const bodyText = await response.text();
  let parsed;
  try {
    parsed = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    parsed = { raw: bodyText };
  }

  if (!response.ok || parsed.success !== true) {
    throw new Error(
      `Falha no sync technical_sheets: HTTP ${response.status} - ${parsed.error || JSON.stringify(parsed)}`
    );
  }
  if (Array.isArray(parsed.conflicts) && parsed.conflicts.length > 0) {
    throw new Error(`Sync retornou conflitos: ${JSON.stringify(parsed.conflicts)}`);
  }
  return parsed;
}

async function main() {
  loadDotEnvFile();

  const tenantId = process.argv[2];
  const email = process.argv[3] || process.env.NEXT_PUBLIC_DEFAULT_LOGIN_EMAIL;
  const password = process.argv[4];
  const syncServer = process.env.NEXT_PUBLIC_SYNC_SERVER || "http://localhost:4000";
  const syncApiKey = process.env.NEXT_PUBLIC_SYNC_API_KEY || "";
  const machineId = `recipes-push-${Date.now()}`;

  if (!tenantId || !email || !password) {
    throw new Error(
      "Uso: node scripts/push-firestore-recipes-to-sync-sql.js <tenantId> <email> <senha>"
    );
  }

  const app = initializeApp(getFirebaseConfig());
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, email, password);

  const db = getFirestore(app);
  const snap = await getDocs(collection(db, `tenants/${tenantId}/technical_sheets`));
  const records = snap.docs.map((d) => normalizeRecord(d.id, d.data(), tenantId));
  console.log(`[recipes-push] receitas_lidas_firestore=${records.length}`);

  if (records.length === 0) {
    console.log("[recipes-push] nenhuma receita no Firestore para enviar.");
    return;
  }

  let sent = 0;
  for (let i = 0; i < records.length; i += 200) {
    const chunk = records.slice(i, i + 200).map((record, index) => ({
      eventId: `${machineId}-${i + index}-${record.id}`,
      record,
    }));
    await postSyncChunk(syncServer, syncApiKey, tenantId, machineId, chunk);
    sent += chunk.length;
  }

  console.log(`[recipes-push] tenant=${tenantId} receitas_enviadas_sql=${sent}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[recipes-push] erro:", err && err.message ? err.message : err);
    process.exit(1);
  });
