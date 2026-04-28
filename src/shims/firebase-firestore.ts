import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Primitive = string | number | boolean | null;

const DELETE_FIELD_SENTINEL = "__delete_field__";
const POLL_INTERVAL_MS = 2500;

export type DocumentData = Record<string, any>;
export type Firestore = { kind: "supabase-firestore" };
export type SetOptions = { merge?: boolean };
export type OrderByDirection = "asc" | "desc";
export type WhereFilterOp = "==" | ">=" | "<=" | ">" | "<";
export type DocumentReference<T = DocumentData> = {
  kind: "doc";
  path: string;
  id: string;
  parent: CollectionReference<T>;
};
export type CollectionReference<T = DocumentData> = {
  kind: "collection";
  path: string;
  parent: DocumentReference | null;
};
export type QueryConstraint =
  | { type: "where"; field: string; op: WhereFilterOp; value: any }
  | { type: "orderBy"; field: string; direction: OrderByDirection }
  | { type: "limit"; value: number }
  | { type: "startAfter"; value: any };
export type Query<T = DocumentData> = {
  kind: "query";
  path: string;
  constraints: QueryConstraint[];
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    };
  };
};

export class FirestoreError extends Error {}

export class Timestamp {
  private readonly value: Date;

  constructor(value: Date | string | number) {
    this.value = value instanceof Date ? value : new Date(value);
  }

  static fromDate(date: Date) {
    return new Timestamp(date);
  }

  static now() {
    return new Timestamp(new Date());
  }

  toDate() {
    return new Date(this.value);
  }

  toISOString() {
    return this.value.toISOString();
  }
}

export type DocumentSnapshot<T = DocumentData> = {
  id: string;
  ref: DocumentReference<T>;
  exists(): boolean;
  data(): T;
};

export type QueryDocumentSnapshot<T = DocumentData> = DocumentSnapshot<T>;

export type QuerySnapshot<T = DocumentData> = {
  docs: QueryDocumentSnapshot<T>[];
  empty: boolean;
  size: number;
};

type PathResolution = {
  table: string;
  idColumn: string;
  idValue?: string;
  filters: Array<{ field: string; value: Primitive }>;
};

function toCanonicalPath(path: string) {
  return path.replace(/^\/+|\/+$/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function convertDatesForClient(value: any): any {
  if (value == null) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed) && /\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value);
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(convertDatesForClient);
  if (typeof value === "object") {
    const next: Record<string, any> = {};
    Object.entries(value).forEach(([key, nested]) => {
      next[key] = convertDatesForClient(nested);
    });
    return next;
  }
  return value;
}

function normalizeOutgoingValue(value: any): any {
  if (value === undefined) return undefined;
  if (value && typeof value === "object" && value.__type === DELETE_FIELD_SENTINEL) {
    return null;
  }
  if (value instanceof Timestamp) {
    return value.toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeOutgoingValue);
  }
  if (value && typeof value === "object") {
    const next: Record<string, any> = {};
    Object.entries(value).forEach(([key, nested]) => {
      const normalized = normalizeOutgoingValue(nested);
      if (normalized !== undefined) {
        next[key] = normalized;
      }
    });
    return next;
  }
  return value;
}

function buildRecordFromRow(row: Record<string, any>, idColumn: string, fallbackId?: string) {
  const next = convertDatesForClient(clone(row));
  const resolvedId = next[idColumn] ?? fallbackId;
  return {
    id: String(resolvedId),
    ...next,
  };
}

function createDocumentSnapshot<T = DocumentData>(
  path: string,
  row: Record<string, any> | null,
  idColumn: string,
  fallbackId?: string
): DocumentSnapshot<T> {
  const data = row ? (buildRecordFromRow(row, idColumn, fallbackId) as T) : null;
  const id = data ? String((data as any).id) : String(fallbackId ?? "");
  const parent: CollectionReference<T> = {
    kind: "collection",
    path,
    parent: null,
  };
  const ref: DocumentReference<T> = { kind: "doc", path: `${path}/${id}`, id, parent };
  return {
    id,
    ref,
    exists: () => Boolean(data),
    data: () => {
      if (!data) {
        throw new Error("Documento nao encontrado.");
      }
      return data;
    },
  };
}

function parsePath(path: string): PathResolution {
  const canonical = toCanonicalPath(path);
  const segments = canonical.split("/").filter(Boolean);

  if (segments.length === 0) {
    throw new Error("Caminho vazio nao suportado.");
  }

  if (canonical === "**/members") {
    return { table: "tenant_members", idColumn: "userId", filters: [] };
  }

  if (segments[0] === "users" && segments.length >= 2) {
    return {
      table: "profiles",
      idColumn: "user_id",
      idValue: segments[1],
      filters: [],
    };
  }

  if (segments[0] === "tenants") {
    if (segments.length === 1) {
      return { table: "tenants", idColumn: "id", filters: [] };
    }

    if (segments.length === 2) {
      return {
        table: "tenants",
        idColumn: "id",
        idValue: segments[1],
        filters: [],
      };
    }

    const tenantId = segments[1];
    const collectionName = segments[2];

    if (collectionName === "members") {
      return {
        table: "tenant_members",
        idColumn: "userId",
        idValue: segments[3],
        filters: [{ field: "tenantId", value: tenantId }],
      };
    }

    if (collectionName === "cash_registers" && segments[4] === "financial_movements") {
      return {
        table: "financial_movements",
        idColumn: "id",
        idValue: segments[5],
        filters: [
          { field: "tenantId", value: tenantId },
          { field: "cashRegisterId", value: segments[3] },
        ],
      };
    }

    if (collectionName === "supplies" && segments[4] === "price_history") {
      return {
        table: "supply_price_history",
        idColumn: "id",
        idValue: segments[5],
        filters: [
          { field: "tenantId", value: tenantId },
          { field: "supplyId", value: segments[3] },
        ],
      };
    }

    return {
      table: collectionName,
      idColumn: "id",
      idValue: segments[3],
      filters: [{ field: "tenantId", value: tenantId }],
    };
  }

  if (segments.length === 1) {
    return { table: segments[0], idColumn: "id", filters: [] };
  }

  return {
    table: segments[0],
    idColumn: "id",
    idValue: segments[1],
    filters: [],
  };
}

function applyFilter(
  builder: any,
  field: string,
  op: WhereFilterOp,
  value: any
) {
  if (op === "==") return builder.eq(field, value);
  if (op === ">=") return builder.gte(field, value instanceof Timestamp ? value.toISOString() : value);
  if (op === "<=") return builder.lte(field, value instanceof Timestamp ? value.toISOString() : value);
  if (op === ">") return builder.gt(field, value instanceof Timestamp ? value.toISOString() : value);
  if (op === "<") return builder.lt(field, value instanceof Timestamp ? value.toISOString() : value);
  throw new Error(`Operador nao suportado: ${op}`);
}

function withBaseFilters(builder: any, resolution: PathResolution) {
  return resolution.filters.reduce(
    (current, filter) => current.eq(filter.field, filter.value),
    builder
  );
}

function makeQuery<T = DocumentData>(
  path: string,
  constraints: QueryConstraint[]
): Query<T> {
  return {
    kind: "query",
    path,
    constraints,
    _query: {
      path: {
        canonicalString: () => path,
        toString: () => path,
      },
    },
  };
}

async function fetchRows<T = DocumentData>(
  path: string,
  constraints: QueryConstraint[]
): Promise<QuerySnapshot<T>> {
  const supabase = getSupabaseBrowserClient();
  const resolution = parsePath(path);
  let request = withBaseFilters(supabase.from(resolution.table).select("*"), resolution);

  for (const constraint of constraints) {
    if (constraint.type === "where") {
      request = applyFilter(request, constraint.field, constraint.op, constraint.value);
    }
    if (constraint.type === "orderBy") {
      request = request.order(constraint.field, { ascending: constraint.direction !== "desc" });
    }
    if (constraint.type === "limit") {
      request = request.limit(constraint.value);
    }
  }

  const { data, error } = await request;
  if (error) {
    throw new FirestoreError(error.message);
  }

  const rows = (data ?? []) as Record<string, any>[];
  return {
    empty: rows.length === 0,
    size: rows.length,
    docs: rows.map((row) =>
      createDocumentSnapshot<T>(path, row, resolution.idColumn, row[resolution.idColumn])
    ),
  };
}

async function fetchDoc<T = DocumentData>(ref: DocumentReference<T>): Promise<DocumentSnapshot<T>> {
  const supabase = getSupabaseBrowserClient();
  const resolution = parsePath(ref.path);
  let request = withBaseFilters(supabase.from(resolution.table).select("*"), resolution);

  if (resolution.idValue) {
    request = request.eq(resolution.idColumn, resolution.idValue);
  }

  const { data, error } = await request.maybeSingle();
  if (error) {
    throw new FirestoreError(error.message);
  }

  return createDocumentSnapshot<T>(toCanonicalPath(ref.path).split("/").slice(0, -1).join("/"), data ?? null, resolution.idColumn, resolution.idValue);
}

function buildInsertPayload(
  path: string,
  id: string | undefined,
  payload: Record<string, any>
) {
  const resolution = parsePath(path);
  const next = normalizeOutgoingValue(payload);

  resolution.filters.forEach((filter) => {
    next[filter.field] = filter.value;
  });

  if (id) {
    next[resolution.idColumn] = id;
  }

  if (resolution.table === "profiles" && id) {
    next.user_id = id;
  }

  if (resolution.table === "tenant_members" && id) {
    next.userId = id;
  }

  if (next.updatedAt === undefined) {
    next.updatedAt = nowIso();
  }
  if (next.createdAt === undefined && id) {
    next.createdAt = nowIso();
  }

  return { resolution, next };
}

async function upsertRecord(path: string, id: string | undefined, payload: Record<string, any>, options?: SetOptions) {
  const supabase = getSupabaseBrowserClient();
  const { resolution, next } = buildInsertPayload(path, id, payload);
  const onConflict =
    resolution.table === "tenant_members"
      ? "tenantId,userId"
      : resolution.table === "profiles"
        ? "user_id"
        : resolution.idColumn;

  const { error } = await supabase
    .from(resolution.table)
    .upsert(next, { onConflict, ignoreDuplicates: false });

  if (error) {
    throw new FirestoreError(error.message);
  }

  if (options?.merge === false && resolution.table !== "profiles") {
    return;
  }
}

export function getFirestore(): Firestore {
  return { kind: "supabase-firestore" };
}

export function serverTimestamp() {
  return Timestamp.now();
}

export function deleteField() {
  return { __type: DELETE_FIELD_SENTINEL };
}

export function collection<T = DocumentData>(
  _firestoreOrRef: Firestore | DocumentReference | CollectionReference,
  ...pathSegments: string[]
): CollectionReference<T> {
  const path = toCanonicalPath(
    pathSegments.length > 0
      ? pathSegments.join("/")
      : (_firestoreOrRef as CollectionReference).path
  );
  const segments = path.split("/");
  const parent =
    segments.length >= 2
      ? ({
          kind: "doc",
          id: segments[segments.length - 2],
          path: segments.slice(0, -1).join("/"),
          parent: {
            kind: "collection",
            path: segments.slice(0, -2).join("/"),
            parent: null,
          },
        } as DocumentReference)
      : null;
  return { kind: "collection", path, parent };
}

export function collectionGroup(_firestore: Firestore, groupId: string): CollectionReference {
  return { kind: "collection", path: `**/${groupId}`, parent: null };
}

export function doc<T = DocumentData>(
  firestoreOrCollection: Firestore | CollectionReference<T>,
  ...pathSegments: string[]
): DocumentReference<T> {
  if ((firestoreOrCollection as CollectionReference<T>).kind === "collection") {
    const collectionRef = firestoreOrCollection as CollectionReference<T>;
    const id = pathSegments[0] ?? crypto.randomUUID();
    return { kind: "doc", path: `${collectionRef.path}/${id}`, id, parent: collectionRef };
  }

  const joined = toCanonicalPath(pathSegments.join("/"));
  const segments = joined.split("/");
  const id = segments[segments.length - 1];
  return {
    kind: "doc",
    path: joined,
    id,
    parent: {
      kind: "collection",
      path: segments.slice(0, -1).join("/"),
      parent: null,
    },
  };
}

export function where(field: string, op: WhereFilterOp, value: any): QueryConstraint {
  return { type: "where", field, op, value };
}

export function orderBy(field: string, direction: OrderByDirection = "asc"): QueryConstraint {
  return { type: "orderBy", field, direction };
}

export function limit(value: number): QueryConstraint {
  return { type: "limit", value };
}

export function startAfter(value: any): QueryConstraint {
  return { type: "startAfter", value };
}

export function query<T = DocumentData>(
  source: CollectionReference<T> | Query<T>,
  ...constraints: QueryConstraint[]
): Query<T> {
  const basePath = source.kind === "query" ? source.path : source.path;
  const baseConstraints = source.kind === "query" ? source.constraints : [];
  return makeQuery(basePath, [...baseConstraints, ...constraints]);
}

export async function getDocs<T = DocumentData>(
  source: CollectionReference<T> | Query<T>
): Promise<QuerySnapshot<T>> {
  const queryLike = source.kind === "query" ? source : makeQuery<T>(source.path, []);
  return fetchRows<T>(queryLike.path, queryLike.constraints);
}

export async function getDocsFromCache<T = DocumentData>(
  source: CollectionReference<T> | Query<T>
): Promise<QuerySnapshot<T>> {
  return getDocs(source);
}

export async function getDoc<T = DocumentData>(ref: DocumentReference<T>) {
  return fetchDoc(ref);
}

export async function addDoc<T = DocumentData>(ref: CollectionReference<T>, data: DocumentData) {
  const documentRef = doc(ref);
  await upsertRecord(ref.path, documentRef.id, data, { merge: false });
  return documentRef;
}

export async function setDoc<T = DocumentData>(
  ref: DocumentReference<T>,
  data: DocumentData,
  options?: SetOptions
) {
  await upsertRecord(ref.path, ref.id, data, options);
}

export async function updateDoc<T = DocumentData>(ref: DocumentReference<T>, data: DocumentData) {
  const supabase = getSupabaseBrowserClient();
  const resolution = parsePath(ref.path);
  let request = withBaseFilters(supabase.from(resolution.table).update(normalizeOutgoingValue({
    ...data,
    updatedAt: nowIso(),
  })), resolution);

  if (resolution.idValue) {
    request = request.eq(resolution.idColumn, resolution.idValue);
  }

  const { error } = await request;
  if (error) {
    throw new FirestoreError(error.message);
  }
}

export async function deleteDoc<T = DocumentData>(ref: DocumentReference<T>) {
  const supabase = getSupabaseBrowserClient();
  const resolution = parsePath(ref.path);
  let request = withBaseFilters(supabase.from(resolution.table).delete(), resolution);

  if (resolution.idValue) {
    request = request.eq(resolution.idColumn, resolution.idValue);
  }

  const { error } = await request;
  if (error) {
    throw new FirestoreError(error.message);
  }
}

export function writeBatch(_firestore: Firestore) {
  const operations: Array<() => Promise<void>> = [];

  return {
    set<T = DocumentData>(ref: DocumentReference<T>, data: DocumentData, options?: SetOptions) {
      operations.push(() => setDoc(ref, data, options ?? { merge: false }));
    },
    update<T = DocumentData>(ref: DocumentReference<T>, data: DocumentData) {
      operations.push(() => updateDoc(ref, data));
    },
    async commit() {
      for (const operation of operations) {
        await operation();
      }
    },
  };
}

export function onSnapshot<T = DocumentData>(
  source: Query<T> | CollectionReference<T> | DocumentReference<T>,
  onNext: (snapshot: any) => void,
  onError?: (error: Error) => void
) {
  let active = true;
  let channel: RealtimeChannel | null = null;
  const supabase = getSupabaseBrowserClient();
  const sourcePath = source.kind === "query" || source.kind === "collection" ? source.path : source.path;
  const resolution = parsePath(sourcePath);

  const emit = async () => {
    try {
      if (!active) return;
      if ((source as DocumentReference<T>).kind === "doc") {
        const snapshot = await getDoc(source as DocumentReference<T>);
        if (active) onNext(snapshot);
      } else {
        const snapshot = await getDocs(source as Query<T> | CollectionReference<T>);
        if (active) onNext(snapshot);
      }
    } catch (error) {
      if (active) onError?.(error as Error);
    }
  };

  void emit();

  channel = supabase
    .channel(`db-${resolution.table}-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: resolution.table },
      () => {
        void emit();
      }
    )
    .subscribe();

  const intervalId = window.setInterval(() => {
    void emit();
  }, POLL_INTERVAL_MS);

  return () => {
    active = false;
    window.clearInterval(intervalId);
    if (channel) {
      void supabase.removeChannel(channel);
    }
  };
}
