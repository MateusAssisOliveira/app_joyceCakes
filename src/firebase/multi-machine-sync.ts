// src/firebase/multi-machine-sync.ts
// 🔄 Sincronização em Tempo Real entre Máquinas

import { 
  collection, 
  onSnapshot
} from 'firebase/firestore';
import { getSdks } from './index';
import React from 'react';

/**
 * Hook para sincronizar coleção em tempo real
 * Exemplo: const { data: orders } = useRealtimeSync('orders');
 */
export function setupRealtimeListener<T extends { id: string }>(
  collectionName: string,
  callback: (data: T[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const { firestore } = getSdks();
    const collectionRef = collection(firestore, collectionName);
    
    // Listener que atualiza quando há mudanças no Firestore
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const data: T[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as T));
        callback(data);
      },
      (error) => {
        console.error(`Erro ao sincronizar ${collectionName}:`, error);
        onError?.(error);
      }
    );
    
    // Retorna função para desinscrever
    return unsubscribe;
  } catch (error) {
    console.error(`Erro ao configurar listener para ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Exemplo de uso em um componente React
 */
export function useSyncedCollection<T extends { id: string }>(
  collectionName: string
) {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    setLoading(true);
    
    const unsubscribe = setupRealtimeListener<T>(
      collectionName,
      (syncedData) => {
        console.log(`✅ Sincronizado: ${collectionName}`, syncedData);
        setData(syncedData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup
    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading, error };
}
