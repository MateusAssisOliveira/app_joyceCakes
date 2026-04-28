import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TimestampLike = {
  toDate(): Date;
};

export function isFirebaseTimestamp(value: unknown): value is TimestampLike {
  return Boolean(
    value &&
      typeof value === "object" &&
      "toDate" in value &&
      typeof (value as TimestampLike).toDate === "function"
  );
}

export function isDateInstance(value: unknown): value is Date {
  return value instanceof Date;
}

export function toIsoString(value: unknown): string {
  if (isFirebaseTimestamp(value)) {
    return value.toDate().toISOString();
  }
  if (isDateInstance(value)) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

export function toDate(value: unknown): Date | null {
  if (isFirebaseTimestamp(value)) {
    return value.toDate();
  }
  if (isDateInstance(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function formatDate(value: unknown, formatStr: string = "PPP 'as' HH:mm"): string {
  const date = toDate(value);
  if (!date) return "";

  try {
    return format(date, formatStr, { locale: ptBR });
  } catch {
    return date.toLocaleDateString("pt-BR");
  }
}

export function formatDateOnly(value: unknown): string {
  return formatDate(value, "PPP");
}

export function formatTimeOnly(value: unknown): string {
  const date = toDate(value);
  if (!date) return "";

  return format(date, "HH:mm", { locale: ptBR });
}

export function formatDateTime(value: unknown): string {
  return formatDate(value, "PPP 'as' HH:mm:ss");
}
