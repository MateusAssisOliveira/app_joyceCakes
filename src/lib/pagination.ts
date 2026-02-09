/**
 * Firestore Pagination Helpers
 * 
 * Propósito:
 * Fornecer utilities para paginação eficiente de dados no Firestore.
 * 
 * Responsabilidade:
 * - Implementar cursor-based pagination
 * - Melhorar performance com grandes datasets
 * - Reduzir leitura desnecessária de documentos
 */

import {
  Firestore,
  Query,
  query,
  limit,
  orderBy,
  startAfter,
  endBefore,
  getDocs,
  collection,
  DocumentData,
  CollectionReference,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  QueryConstraint,
  OrderByDirection,
} from 'firebase/firestore';
import { createLogger } from './logger';

const logger = createLogger('Pagination');

export interface PaginationOptions {
  pageSize: number;
  direction?: 'next' | 'prev';
}

export interface PaginatedResult<T extends DocumentData = DocumentData> {
  items: Array<T & { id: string }>;
  hasMore: boolean;
  nextCursor: QueryDocumentSnapshot<T> | null;
  prevCursor: QueryDocumentSnapshot<T> | null;
}

/**
 * Executa uma query com paginação usando cursor
 */
export async function executePaginatedQuery<T extends DocumentData = DocumentData>(
  q: Query<T>,
  pageSize: number,
  cursor?: QueryDocumentSnapshot<T> | DocumentSnapshot<T> | null
): Promise<PaginatedResult<T>> {
  try {
    // Fetch pageSize + 1 para saber se há mais items
    let paginatedQuery = q;
    
    if (cursor) {
      paginatedQuery = query(q, startAfter(cursor));
    }

    paginatedQuery = query(paginatedQuery, limit(pageSize + 1));

    const snapshot = await getDocs(paginatedQuery);
    const docs = snapshot.docs;

    const hasMore = docs.length > pageSize;
    const items = docs.slice(0, pageSize).map(doc => ({
      id: doc.id,
      ...(doc.data() as T),
    })) as Array<T & { id: string }>;

    const nextCursor = hasMore ? (docs[pageSize - 1] as QueryDocumentSnapshot<T>) : null;
    const prevCursor = null; // Para implementar prev, seria mais complexo

    return {
      items,
      hasMore,
      nextCursor,
      prevCursor,
    };
  } catch (error) {
    logger.error('Erro ao executar paginação', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Wrapper para queries comuns com ordenação padrão
 */
export async function getPaginatedCollection<T extends DocumentData = DocumentData>(
  firestore: Firestore,
  collectionName: string,
  pageSize: number = 20,
  constraints?: QueryConstraint[],
  orderByField?: string,
  orderDirection?: OrderByDirection
): Promise<PaginatedResult<T>> {
  const constraints_array: QueryConstraint[] = [];

  if (orderByField) {
    constraints_array.push(orderBy(orderByField, orderDirection || 'desc'));
  }

  if (constraints) {
    constraints_array.push(...constraints);
  }

  const queryConstraints = constraints_array.length > 0 ? constraints_array : [];

  const collRef = collection(firestore, collectionName) as CollectionReference<T>;
  const q = query(collRef, ...queryConstraints);

  return executePaginatedQuery<T>(q, pageSize);
}

/**
 * Helper para obter todos os items de uma coleção (use com cuidado para datasets pequenos)
 */
export async function getAllCollectionItems<T>(
  q: Query<T>
): Promise<T[]> {
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    logger.error('Erro ao obter items da coleção', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Helper para cache local simples (para datasets pequenos que mudam pouco)
 */
export class CollectionCache<T> {
  private data: T[] | null = null;
  private lastFetch: number = 0;
  private ttl: number; // milliseconds

  constructor(ttl: number = 5 * 60 * 1000) { // default 5 minutes
    this.ttl = ttl;
  }

  async fetch(getFn: () => Promise<T[]>): Promise<T[]> {
    const now = Date.now();
    
    if (this.data && now - this.lastFetch < this.ttl) {
      logger.debug('Returning cached data');
      return this.data;
    }

    logger.debug('Fetching fresh data and caching');
    this.data = await getFn();
    this.lastFetch = now;
    return this.data;
  }

  invalidate() {
    this.data = null;
    this.lastFetch = 0;
  }
}

// Re-export common Firestore types for convenience
export { DocumentSnapshot };
