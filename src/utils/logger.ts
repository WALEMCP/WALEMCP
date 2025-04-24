/**
 * Logger Utility
 * Handles logging for MCP Core
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Unified logging system for MCP
 */
export class Logger {
  private level: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param data Additional data to log
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Log an info message
   * @param message The message to log
   * @param data Additional data to log
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param data Additional data to log
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param data Additional data to log
   */
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * Change the current log level
   * @param level New log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get the current log level
   * @returns Current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  // Internal logging method
  private log(level: LogLevel, message: string, data?: any): void {
    // Only log if the level is high enough
    if (this.levels[level] < this.levels[this.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        if (data) console.debug(data);
        break;
      case 'info':
        console.info(formattedMessage);
        if (data) console.info(data);
        break;
      case 'warn':
        console.warn(formattedMessage);
        if (data) console.warn(data);
        break;
      case 'error':
        console.error(formattedMessage);
        if (data) console.error(data);
        break;
    }

    // In a production environment, you might want to:
    // 1. Send logs to a centralized logging service
    // 2. Write logs to a file
    // 3. Implement log rotation
    // 4. Add additional context (request ID, user ID, etc.)
  }
} 