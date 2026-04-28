import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
  User as SupabaseUser,
} from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type UserInfo = {
  providerId?: string;
  uid: string;
};

export type User = {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  providerData: UserInfo[];
  tenantId: string | null;
  user_metadata?: Record<string, any>;
};

export type Unsubscribe = () => void;

export type Auth = {
  currentUser: User | null;
  client: SupabaseClient;
};

type AuthListener = (user: User | null) => void;
type AuthErrorListener = (error: Error) => void;

let authSingleton: Auth | null = null;
let authSubscriptionInitialized = false;

function mapUser(user: SupabaseUser | null): User | null {
  if (!user) return null;

  const providers =
    Array.isArray(user.identities) && user.identities.length > 0
      ? user.identities.map((identity) => ({
          providerId: identity.provider,
          uid: identity.user_id,
        }))
      : [
          {
            providerId: (user.app_metadata?.provider as string | undefined) ?? "email",
            uid: user.id,
          },
        ];

  return {
    uid: user.id,
    id: user.id,
    email: user.email ?? null,
    displayName: (user.user_metadata?.name as string | undefined) ?? user.email ?? null,
    emailVerified: !!user.email_confirmed_at,
    phoneNumber: user.phone ?? null,
    providerData: providers,
    tenantId: null,
    user_metadata: user.user_metadata,
  };
}

export function getAuth(): Auth {
  if (authSingleton) {
    return authSingleton;
  }

  const client = getSupabaseBrowserClient();
  authSingleton = {
    client,
    currentUser: null,
  };

  void client.auth.getSession().then(({ data }) => {
    authSingleton!.currentUser = mapUser(data.session?.user ?? null);
  });

  if (!authSubscriptionInitialized) {
    authSubscriptionInitialized = true;
    client.auth.onAuthStateChange((_event, session) => {
      if (!authSingleton) return;
      authSingleton.currentUser = mapUser(session?.user ?? null);
    });
  }

  return authSingleton;
}

export function onAuthStateChanged(
  auth: Auth,
  nextOrObserver: AuthListener,
  error?: AuthErrorListener
): Unsubscribe {
  let active = true;

  void auth.client.auth
    .getSession()
    .then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        error?.(sessionError);
        return;
      }
      const nextUser = mapUser(data.session?.user ?? null);
      auth.currentUser = nextUser;
      nextOrObserver(nextUser);
    })
    .catch((sessionError) => {
      if (!active) return;
      error?.(sessionError as Error);
    });

  const { data: subscription } = auth.client.auth.onAuthStateChange(
    (_event: AuthChangeEvent, session: Session | null) => {
      if (!active) return;
      const nextUser = mapUser(session?.user ?? null);
      auth.currentUser = nextUser;
      nextOrObserver(nextUser);
    }
  );

  return () => {
    active = false;
    subscription.subscription.unsubscribe();
  };
}

export async function signInAnonymously(_auth: Auth) {
  throw new Error("Login anonimo nao e suportado na migracao para Supabase.");
}

export async function createUserWithEmailAndPassword(auth: Auth, email: string, password: string) {
  const { data, error } = await auth.client.auth.signUp({ email, password });
  if (error) throw error;
  auth.currentUser = mapUser(data.user);
  return { user: auth.currentUser };
}

export async function signInWithEmailAndPassword(auth: Auth, email: string, password: string) {
  const { data, error } = await auth.client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  auth.currentUser = mapUser(data.user);
  return { user: auth.currentUser };
}
