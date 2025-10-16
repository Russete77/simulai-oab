/**
 * Logger estruturado para produção
 *
 * Substitui console.log por um sistema de logging adequado
 * que funciona em desenvolvimento e produção.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isServer = typeof window === 'undefined';

  private log(level: LogLevel, message: string, meta?: LogMetadata) {
    // Em desenvolvimento, apenas debug não aparece
    if (!this.isDevelopment && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      environment: process.env.NODE_ENV,
      ...(meta && { meta }),
    };

    // Em produção, enviar para serviço externo (Sentry, LogRocket, etc)
    if (process.env.NODE_ENV === 'production' && this.isServer) {
      // TODO: Integrar com Sentry quando configurado
      // Sentry.captureMessage(message, { level, extra: meta });

      // Por enquanto, log estruturado no console
      console[level === 'debug' ? 'log' : level](JSON.stringify(logData));
    } else {
      // Em desenvolvimento, log colorido e legível
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[34m',  // Blue
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      };
      const reset = '\x1b[0m';

      console[level === 'debug' ? 'log' : level](
        `${colors[level]}[${level.toUpperCase()}]${reset} ${message}`,
        meta || ''
      );
    }
  }

  debug(message: string, meta?: LogMetadata) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: LogMetadata) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: LogMetadata) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: LogMetadata) {
    this.log('error', message, meta);
  }

  // Helper para logar tempo de execução
  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    meta?: LogMetadata
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.debug(`${label} completed`, { ...meta, duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed`, {
        ...meta,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export const logger = new Logger();
