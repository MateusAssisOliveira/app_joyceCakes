/**
 * Error Handling System
 * 
 * Propósito:
 * Centralizar e padronizar o tratamento de erros em toda a aplicação.
 * 
 * Responsabilidade:
 * - Classificar erros por tipo (validação, autenticação, permissão, etc)
 * - Fornecer mensagens de erro consistentes e úteis
 * - Registrar erros apropriadamente
 * - Fornecer contexto ao usuário final
 */

import { createLogger } from './logger';
import { FirestorePermissionError } from '@/firebase/errors';

const logger = createLogger('ErrorHandler');

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  AUTHENTICATION = 'AUTHENTICATION',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public userMessage: string,
    public details?: unknown,
    public statusCode: number = 500
  ) {
    super(userMessage);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Classifica um erro e o converte para AppError se necessário
 */
export function classifyError(error: unknown, context?: string): AppError {
  // Já é um AppError
  if (error instanceof AppError) {
    return error;
  }

  // Zod validation error
  if (error instanceof Error && error.message.includes('Dados inválidos')) {
    return new AppError(
      ErrorType.VALIDATION,
      'Os dados enviados são inválidos. Verifique os campos e tente novamente.',
      error,
      400
    );
  }

  // Firebase permission error
  if (error instanceof FirestorePermissionError) {
    return new AppError(
      ErrorType.PERMISSION_DENIED,
      'Você não tem permissão para realizar esta ação.',
      error,
      403
    );
  }

  // Firebase not-found error
  if (error instanceof Error && error.message.includes('não encontrado')) {
    return new AppError(
      ErrorType.NOT_FOUND,
      'O recurso solicitado não foi encontrado.',
      error,
      404
    );
  }

  // Network errors (including offline)
  if (error instanceof Error && (
    error.message.includes('Network') ||
    error.message.includes('offline') ||
    error.message.includes('Failed to fetch')
  )) {
    return new AppError(
      ErrorType.NETWORK,
      'Erro de conexão. Verifique sua internet e tente novamente.',
      error,
      503
    );
  }

  // Generic Error
  if (error instanceof Error) {
    logger.error(`Erro não classificado${context ? ` em ${context}` : ''}`, error);
    
    return new AppError(
      ErrorType.UNKNOWN,
      'Ocorreu um erro inesperado. Tente novamente em alguns momentos.',
      error,
      500
    );
  }

  // Unknown non-Error object
  logger.error(`Erro não-Error${context ? ` em ${context}` : ''}`, undefined, { details: error });
  
  return new AppError(
    ErrorType.UNKNOWN,
    'Ocorreu um erro inesperado. Tente novamente em alguns momentos.',
    error,
    500
  );
}

/**
 * Wraps async functions com error handling centralizado
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = classifyError(error, context);
      logger.error(
        `Erro em ${context}`,
        error instanceof Error ? error : undefined,
        {
          type: appError.type,
          userMessage: appError.userMessage,
        }
      );
      throw appError;
    }
  }) as T;
}

/**
 * Formata um AppError para exibição ao usuário
 */
export function formatErrorForUI(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }

  const appError = classifyError(error);
  return appError.userMessage;
}

/**
 * Trata erro com logging e retorna mensagem segura para usuário
 */
export function handleError(error: unknown, context?: string): { message: string; type: ErrorType } {
  const appError = classifyError(error, context);
  
  logger.error(
    `Erro${context ? ` em ${context}` : ''}`,
    error instanceof Error ? error : undefined,
    { type: appError.type }
  );

  return {
    message: appError.userMessage,
    type: appError.type,
  };
}
