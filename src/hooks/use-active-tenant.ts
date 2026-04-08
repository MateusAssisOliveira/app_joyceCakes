'use client';

import { useEffect, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import type { UserProfile } from '@/types';

export function useActiveTenant() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const userProfileRef = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const activeTenantId = userProfile?.activeTenantId || user?.uid || null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeTenantId) {
      window.localStorage.setItem('activeTenantId', activeTenantId);
    }
  }, [activeTenantId]);

  return {
    activeTenantId,
    userProfile,
    isLoading: isUserLoading || isProfileLoading,
  };
}
