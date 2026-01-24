
import { Timestamp } from 'firebase/firestore';

/**
 * Recursively converts Firestore Timestamps within an object to ISO date strings.
 * This is crucial for making Firestore data serializable and safe to pass from
 * Server Components to Client Components in Next.js.
 *
 * @param obj The object (or array) to process.
 * @returns A new object with all Timestamps converted to ISO strings.
 */
export function serializeObject<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // Handle Firestore Timestamps
  if (obj instanceof Timestamp) {
    return obj.toDate().toISOString() as any;
  }
  
  // Handle native Date objects
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }

  // Handle arrays by recursively serializing each item
  if (Array.isArray(obj)) {
    return obj.map(item => serializeObject(item)) as any;
  }

  // Handle objects by recursively serializing each value
  const newObj = {} as { [key: string]: any };
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = serializeObject(obj[key as keyof T]);
    }
  }

  return newObj as T;
}
