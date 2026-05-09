'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  SupabaseStoreError,
  QuerySnapshot,
  CollectionReference,
  Timestamp,
} from '@/supabase/compat/SupabaseStore';
import { errorEmitter } from '@/supabase/compat/error-emitter';
import { SupabaseStorePermissionError } from '@/supabase/compat/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: SupabaseStoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/Supabase/Supabase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/SupabaseStore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * Recursively converts SupabaseStore Timestamps to JavaScript Date objects.
 * @param obj The object to process.
 * @returns A new object with Timestamps converted to Dates.
 */
function convertTimestamps(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Timestamp) {
    return obj.toDate();
  }

  if (obj instanceof Date) {
    return obj;
  }
  
  const result: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    result[key] = convertTimestamps(obj[key]);
  }
  return result;
}

/**
 * React hook to subscribe to a SupabaseStore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! You MUST MEMOIZE the inputted targetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The SupabaseStore CollectionReference or Query. Waits if null/undefined.
 * @param {object} [options] - Optional options object.
 * @param {T[] | null} [options.initialData] - Optional initial data to avoid loading state.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    targetRefOrQuery: (CollectionReference<DocumentData> | Query<DocumentData>)  | null | undefined,
    options?: { initialData?: WithId<T>[] | null }
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(options?.initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!options?.initialData);
  const [error, setError] = useState<SupabaseStoreError | Error | null>(null);

  useEffect(() => {
    if (!targetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      targetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({
          ...(convertTimestamps(doc.data()) as T),
          id: doc.id,
        }));
        
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      async () => {
        const path = "path" in targetRefOrQuery ? targetRefOrQuery.path : (targetRefOrQuery as InternalQuery)._query.path.canonicalString();

        const contextualError = new SupabaseStorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [targetRefOrQuery]); // Re-run if the target query/reference changes.
  
  return { data, isLoading, error };
}
