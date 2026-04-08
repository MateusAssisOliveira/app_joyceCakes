import type { User } from 'firebase/auth';
import {
  Firestore,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { updateUserProfile } from './userService';
import type { Tenant, TenantMember, TenantRole } from '@/types';
import { getTenantMemberPath } from '@/lib/tenant';

export async function createTenant(
  firestore: Firestore,
  user: User,
  tenantName: string
): Promise<string> {
  const tenantRef = doc(collection(firestore, 'tenants'));
  const tenantId = tenantRef.id;
  const memberRef = doc(firestore, getTenantMemberPath(tenantId, user.uid));

  const batch = writeBatch(firestore);
  batch.set(tenantRef, {
    name: tenantName,
    ownerUserId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(memberRef, {
    userId: user.uid,
    role: 'owner',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  await updateUserProfile(firestore, user.uid, { activeTenantId: tenantId });

  return tenantId;
}

export async function switchActiveTenant(
  firestore: Firestore,
  userId: string,
  tenantId: string
): Promise<void> {
  await updateUserProfile(firestore, userId, { activeTenantId: tenantId });
}

export async function inviteTenantMemberByUid(
  firestore: Firestore,
  tenantId: string,
  targetUserId: string,
  role: TenantRole
): Promise<void> {
  const targetRef = doc(firestore, getTenantMemberPath(tenantId, targetUserId));
  await setDoc(
    targetRef,
    {
      userId: targetUserId,
      role,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function listUserTenants(firestore: Firestore, userId: string): Promise<Tenant[]> {
  const membershipsQuery = query(
    collectionGroup(firestore, 'members'),
    where('userId', '==', userId),
    where('status', '==', 'active')
  );

  const membershipsSnapshot = await getDocs(membershipsQuery);
  const tenants = await Promise.all(
    membershipsSnapshot.docs.map(async (memberDoc) => {
      const tenantRef = memberDoc.ref.parent.parent;
      if (!tenantRef) return null;
      const tenantSnapshot = await getDoc(tenantRef);
      if (!tenantSnapshot.exists()) return null;
      return {
        id: tenantSnapshot.id,
        ...(tenantSnapshot.data() as Omit<Tenant, 'id'>),
      } as Tenant;
    })
  );

  return tenants.filter((tenant): tenant is Tenant => Boolean(tenant));
}

export async function getTenantMembers(firestore: Firestore, tenantId: string): Promise<TenantMember[]> {
  const snapshot = await getDocs(collection(firestore, `tenants/${tenantId}/members`));
  return snapshot.docs.map((memberDoc) => ({
    id: memberDoc.id,
    ...(memberDoc.data() as Omit<TenantMember, 'id'>),
  }));
}
