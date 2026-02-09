/**
 * Centralized Logger System
 * 
 * Propósito:
 * Fornecer um sistema de logging estruturado e controlado para toda a aplicação.
 * 
 * Responsabilidade:
 * - Centralizar e padronizar logs em toda a aplicação
 * - Permitir diferentes níveis de log (debug, info, warn, error)
 * - Controlar verbosidade via variáveis de ambiente
 * - Facilitar debugging em desenvolvimento e monitoramento em produção
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  module?: string;
  userId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private enableDebug = process.env.NEXT_PUBLIC_DEBUG === 'true';

  /**
   * Log a debug message (development only)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment || this.enableDebug) {
      this.log('debug', message, context);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | null, context?: LogContext) {
    this.log('error', message, {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: this.isDevelopment ? error?.stack : undefined,
    });
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const prefix = context?.module ? `[${context.module}]` : '';
    const fullMessage = `${timestamp} ${prefix} ${message}`;

    const logData = context ? { ...context } : {};
    
    // Remove temporary fields
    delete logData.module;

    const hasContext = Object.keys(logData).length > 0;

    switch (level) {
      case 'debug':
        if (hasContext) console.debug(fullMessage, logData);
        else console.debug(fullMessage);
        break;
      case 'info':
        if (hasContext) console.info(fullMessage, logData);
        else console.info(fullMessage);
        break;
      case 'warn':
        if (hasContext) console.warn(fullMessage, logData);
        else console.warn(fullMessage);
        break;
      case 'error':
        if (hasContext) console.error(fullMessage, logData);
        else console.error(fullMessage);
        break;
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create a scoped logger for a specific module
 */
export function createLogger(moduleName: string) {
  return {
    debug: (message: string, context?: Omit<LogContext, 'module'>) =>
      logger.debug(message, { ...context, module: moduleName }),
    info: (message: string, context?: Omit<LogContext, 'module'>) =>
      logger.info(message, { ...context, module: moduleName }),
    warn: (message: string, context?: Omit<LogContext, 'module'>) =>
      logger.warn(message, { ...context, module: moduleName }),
    error: (message: string, error?: Error | null, context?: Omit<LogContext, 'module'>) =>
      logger.error(message, error, { ...context, module: moduleName }),
  };
}
