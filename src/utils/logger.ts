/**
 * Production-safe logging utility
 * Prevents console.log spam in production builds
 */

interface LogLevel {
  DEBUG: number;
  INFO: number;
  WARN: number;
  ERROR: number;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  private isDevelopment: boolean;
  private logLevel: number;
  private maxLogs: number = 100; // Limit logs to prevent memory issues
  private logCount: number = 0;

  constructor() {
    this.isDevelopment = __DEV__;
    this.logLevel = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
  }

  private shouldLog(level: number): boolean {
    if (this.logCount >= this.maxLogs) {
      return false;
    }
    return level >= this.logLevel;
  }

  private formatMessage(prefix: string, ...args: any[]): any[] {
    this.logCount++;
    const timestamp = new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
    return [`[${timestamp}] ${prefix}`, ...args];
  }

  debug(tag: string, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage(`🐛 ${tag}`, ...args));
    }
  }

  info(tag: string, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(...this.formatMessage(`ℹ️ ${tag}`, ...args));
    }
  }

  warn(tag: string, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(...this.formatMessage(`⚠️ ${tag}`, ...args));
    }
  }

  error(tag: string, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(...this.formatMessage(`❌ ${tag}`, ...args));
    }
  }

  // Performance logging for critical operations
  perf(tag: string, operation: string, duration: number): void {
    if (this.isDevelopment && duration > 100) { // Only log slow operations
      console.log(...this.formatMessage(`⏱️ ${tag}`, `${operation} took ${duration}ms`));
    }
  }

  // Memory usage logging
  memory(tag: string, context?: string): void {
    if (this.isDevelopment && (global as any).performance?.memory) {
      const memory = (global as any).performance.memory;
      console.log(...this.formatMessage(`🧠 ${tag}`, 
        `Memory ${context || ''}: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB used, ${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB total`
      ));
    }
  }

  // Clear logs (useful for preventing memory buildup)
  clear(): void {
    this.logCount = 0;
    if (this.isDevelopment) {
      console.clear();
    }
  }

  // Get logging stats
  getStats(): { logCount: number; maxLogs: number; isDevelopment: boolean } {
    return {
      logCount: this.logCount,
      maxLogs: this.maxLogs,
      isDevelopment: this.isDevelopment,
    };
  }
}

// Export singleton instance
const logger = new Logger();

export default logger;

// Convenience exports for common patterns
export const logDebug = (tag: string, ...args: any[]) => logger.debug(tag, ...args);
export const logInfo = (tag: string, ...args: any[]) => logger.info(tag, ...args);
export const logWarn = (tag: string, ...args: any[]) => logger.warn(tag, ...args);
export const logError = (tag: string, ...args: any[]) => logger.error(tag, ...args);
export const logPerf = (tag: string, operation: string, duration: number) => logger.perf(tag, operation, duration);
export const logMemory = (tag: string, context?: string) => logger.memory(tag, context);
