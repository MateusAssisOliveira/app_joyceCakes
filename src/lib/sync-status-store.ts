export type SyncHealth = "idle" | "syncing" | "ok" | "warning" | "error";

export type SyncStatusSnapshot = {
  health: SyncHealth;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  currentOperation: string | null;
};

type Listener = (snapshot: SyncStatusSnapshot) => void;

let state: SyncStatusSnapshot = {
  health: "idle",
  lastSuccessAt: null,
  lastErrorAt: null,
  lastErrorMessage: null,
  currentOperation: null,
};

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener(state);
  }
}

export function setSyncStatusPatch(
  patch: Partial<SyncStatusSnapshot>
): SyncStatusSnapshot {
  state = { ...state, ...patch };
  emit();
  return state;
}

export function getSyncStatusSnapshot(): SyncStatusSnapshot {
  return state;
}

export function subscribeSyncStatus(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

