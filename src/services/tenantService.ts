import type { User } from "firebase/auth";
import { Firestore, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getTenantMemberPath } from "@/lib/tenant";

export async function ensureTenantBootstrap(firestore: Firestore, user: User): Promise<void> {
  const tenantId = user.uid;
  const tenantRef = doc(firestore, `tenants/${tenantId}`);
  const tenantMemberRef = doc(firestore, getTenantMemberPath(tenantId, user.uid));
  const userRef = doc(firestore, `users/${user.uid}`);

  const displayName = user.displayName || user.email?.split("@")[0] || "Minha Confeitaria";

  await setDoc(
    tenantRef,
    {
      name: displayName,
      ownerUserId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    tenantMemberRef,
    {
      userId: user.uid,
      role: "owner",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    userRef,
    {
      email: user.email || "",
      name: user.displayName || "",
      activeTenantId: tenantId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
