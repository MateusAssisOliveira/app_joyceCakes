// Camada de compatibilidade historica.
// O app mantem os mesmos hooks/exports antigos, mas a implementacao agora usa Supabase.

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const compatApp = { name: "supabase-compat-app" } as const;

export function getSdks() {
  return {
    firebaseApp: compatApp,
    auth: getAuth(),
    firestore: getFirestore(),
  };
}

export * from "./provider";
export * from "./client-provider";
export * from "./firestore/use-collection";
export * from "./firestore/use-doc";
export * from "./non-blocking-updates";
export * from "./errors";
export * from "./error-emitter";
