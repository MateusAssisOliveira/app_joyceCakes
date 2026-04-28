"use client";

import type { ReactNode } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { useCurrentUser } from "@/supabase";

type CompatApp = { name: string };

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: CompatApp;
  firestore: Firestore;
  auth: ReturnType<typeof getAuth>;
  user: ReturnType<typeof useCurrentUser>["user"];
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser extends FirebaseContextState {}

export interface UserHookResult {
  user: ReturnType<typeof useCurrentUser>["user"];
  isUserLoading: boolean;
  userError: Error | null;
}

const compatApp: CompatApp = { name: "supabase-compat-app" };

export function FirebaseProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useFirebase(): FirebaseServicesAndUser {
  const { user, isUserLoading, userError } = useCurrentUser();

  return {
    areServicesAvailable: true,
    firebaseApp: compatApp,
    firestore: getFirestore(),
    auth: getAuth(),
    user,
    isUserLoading,
    userError,
  };
}

export const useAuth = () => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useFirebaseApp = (): CompatApp => useFirebase().firebaseApp;
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
