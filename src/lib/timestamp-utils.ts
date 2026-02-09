/**
 * Firestore Timestamp Utilities
 * 
 * Propósito:
 * Fornecer helpers type-safe para trabalhar com Firestore Timestamps.
 * 
 * Responsabilidade:
 * - Converter Timestamps para strings de forma segura
 * - Validar e converter datas de múltiplas fontes
 * - Reduzir type casting com 'as any' no código
 */

import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Type guard para verificar se um valor é um Firestore Timestamp
 */
export function isFirebaseTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

/**
 * Type guard para verificar se um valor é uma instância de Date
 */
export function isDateInstance(value: unknown): value is Date {
  return value instanceof Date;
}

/**
 * Converte qualquer valor de data para uma string ISO
 */
export function toIsoString(value: unknown): string {
  if (isFirebaseTimestamp(value)) {
    return value.toDate().toISOString();
  }
  if (isDateInstance(value)) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return '';
}

/**
 * Converte qualquer valor de data para uma instância Date
 */
export function toDate(value: unknown): Date | null {
  if (isFirebaseTimestamp(value)) {
    return value.toDate();
  }
  if (isDateInstance(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      return new Date(value);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Formata uma data para string legível em português
 * @param value - Timestamp, Date ou string ISO
 * @param formatStr - Formato date-fns (default: "PPP 'às' HH:mm")
 */
export function formatDate(value: unknown, formatStr: string = "PPP 'às' HH:mm"): string {
  const date = toDate(value);
  if (!date) return '';
  
  try {
    return format(date, formatStr, { locale: ptBR });
  } catch {
    return date.toLocaleDateString('pt-BR');
  }
}

/**
 * Formata uma data apenas (sem hora)
 */
export function formatDateOnly(value: unknown): string {
  return formatDate(value, 'PPP');
}

/**
 * Formata uma hora apenas
 */
export function formatTimeOnly(value: unknown): string {
  const date = toDate(value);
  if (!date) return '';
  
  return format(date, 'HH:mm', { locale: ptBR });
}

/**
 * Formata com data e hora completa
 */
export function formatDateTime(value: unknown): string {
  return formatDate(value, "PPP 'às' HH:mm:ss");
}
