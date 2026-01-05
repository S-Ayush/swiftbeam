type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatLog(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && Object.keys(context).length > 0 ? { context } : {}),
    };
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // Pretty print in development
      const color = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m', // green
        warn: '\x1b[33m', // yellow
        error: '\x1b[31m', // red
      };
      const reset = '\x1b[0m';
      console.log(
        `${color[entry.level]}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}`,
        entry.context ? entry.context : ''
      );
    } else {
      // JSON output for production (for log aggregation)
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.output(this.formatLog('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    this.output(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.output(this.formatLog('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    this.output(this.formatLog('error', message, context));
  }

  // Specialized logging methods
  http(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    this.info(`${method} ${path} ${statusCode} ${duration}ms`, {
      type: 'http',
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  }

  auth(action: string, userId?: string, context?: LogContext): void {
    this.info(`Auth: ${action}`, {
      type: 'auth',
      action,
      ...(userId ? { userId } : {}),
      ...context,
    });
  }

  room(action: string, roomCode: string, context?: LogContext): void {
    this.info(`Room: ${action}`, {
      type: 'room',
      action,
      roomCode,
      ...context,
    });
  }

  socket(event: string, socketId: string, context?: LogContext): void {
    this.debug(`Socket: ${event}`, {
      type: 'socket',
      event,
      socketId,
      ...context,
    });
  }

  presence(action: string, userId: string, orgId: string, context?: LogContext): void {
    this.debug(`Presence: ${action}`, {
      type: 'presence',
      action,
      userId,
      orgId,
      ...context,
    });
  }
}

export const logger = new Logger();
