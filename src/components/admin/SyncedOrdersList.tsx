// src/components/admin/SyncedOrdersList.tsx
// ✅ Exemplo de Componente que Sincroniza em Tempo Real entre Máquinas

'use client';

import React, { useEffect, useState } from 'react';
import { getSdks } from '@/firebase/index';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';

interface Order {
  id: string;
  clientName: string;
  items: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 🔄 Este componente sincroniza em tempo real
 * - Máquina 1 cria pedido → Máquina 2 vê instantaneamente
 * - Não depende de refresh/reload
 */
export function SyncedOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [machineId] = useState(() => {
    // Gera ID único para esta máquina (para log)
    return 'machine-' + Math.random().toString(36).substr(2, 9);
  });

  useEffect(() => {
    console.log(`🚀 Iniciando sincronização em tempo real...`);
    console.log(`📍 Máquina ID: ${machineId}`);

    try {
      const { firestore } = getSdks();
      const ordersRef = collection(firestore, 'orders');

      // 🔄 LISTENER - Atualiza quando há mudanças no Firestore
      const unsubscribe = onSnapshot(
        ordersRef,
        (snapshot) => {
          console.log(`✅ Dados sincronizados!`);
          console.log(`📦 Total de pedidos: ${snapshot.docs.length}`);

          const ordersData: Order[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              clientName: data.clientName || 'Sem nome',
              items: data.items || 0,
              total: data.total || 0,
              status: data.status || 'pending',
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            } as Order;
          });

          // Ordena por mais recente primeiro
          ordersData.sort(
            (a, b) => b.updatedAt.toDate().getTime() - a.updatedAt.toDate().getTime()
          );

          setOrders(ordersData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Erro ao sincronizar:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      // Limpeza quando o componente e desmontado
      return () => {
        console.log('🛑 Parando sincronização...');
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Erro ao configurar listener:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLoading(false);
    }
  }, [machineId]);

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800">
          ⏳ Conectando ao Firestore... (Máquina: {machineId})
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-800">❌ Erro: {error}</p>
        <p className="text-sm text-red-600 mt-2">
          Verifique:
          <br />
          - Se está logado no Firebase
          <br />
          - Se tem permissão de leitura no Firestore
          <br />
          - Se o projeto Firebase está ativo
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header com info de sincronização */}
      <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
        <p className="text-green-800 text-sm font-medium">
          ✅ Sincronizado em tempo real
          <span className="ml-2 text-gray-600">
            ({orders.length} pedidos) - {machineId}
          </span>
        </p>
      </div>

      {/* Lista de pedidos */}
      {orders.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
          <p>📭 Nenhum pedido ainda</p>
          <p className="text-sm mt-2">
            Crie um novo pedido em qualquer máquina e ele aparecerá aqui
            automaticamente!
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{order.clientName}</h3>
                  <p className="text-sm text-gray-500">ID: {order.id}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {order.status === 'completed'
                    ? '✅ Completo'
                    : order.status === 'cancelled'
                      ? '❌ Cancelado'
                      : '⏳ Pendente'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2 text-sm">
                <div>
                  <p className="text-gray-500">Itens</p>
                  <p className="font-semibold">{order.items}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-semibold">R$ {order.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Atualizado</p>
                  <p className="font-semibold text-xs">
                    {order.updatedAt.toDate().toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Badge mostrando se foi editado em outra máquina */}
              {order.createdAt.toDate() !== order.updatedAt.toDate() && (
                <div className="text-xs text-blue-600 italic">
                  🔄 Editado em outra máquina
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Informações de debug */}
      <details className="mt-6 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <summary className="cursor-pointer font-medium">
          🔍 Informações de Debug
        </summary>
        <pre className="mt-3 overflow-x-auto bg-white p-2 rounded text-xs">
          {JSON.stringify(
            {
              totalOrders: orders.length,
              machineId,
              lastSync: new Date().toLocaleTimeString('pt-BR'),
              firebaseConnected: true,
            },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
}

/**
 * COMO USAR:
 *
 * 1. Importe em um page.tsx do admin:
 *    import { SyncedOrdersList } from '@/components/admin/SyncedOrdersList';
 *
 * 2. Use no componente:
 *    <SyncedOrdersList />
 *
 * 3. Pronto! Abre em 2 máquinas e vê sincronização em tempo real.
 *
 * O que acontece internamente:
 * - onSnapshot() monitora a coleção 'orders' no Firestore
 * - Quando há mudança (novo pedido, edição, etc), callback é acionado
 * - Estado React atualiza automaticamente
 * - Componente re-renderiza
 * - Usuário vê a mudança SEM RELOAD
 */

