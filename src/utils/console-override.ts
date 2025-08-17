/**
 * Production-safe console override
 * Prevents console spam in production builds while preserving errors
 */

interface OriginalConsole {
  log: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

class ProductionSafeConsole {
  private originalConsole: OriginalConsole;
  private isDevelopment: boolean;
  private logCount: number = 0;
  private maxLogs: number = 50; // Severely limit logs in production

  constructor() {
    this.isDevelopment = __DEV__;
    this.originalConsole = {
      log: console.log.bind(console),
      debug: console.debug?.bind(console) || console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };
  }

  private shouldLog(): boolean {
    if (!this.isDevelopment) {
      return false; // No logging in production
    }
    if (this.logCount >= this.maxLogs) {
      return false; // Limit reached
    }
    return true;
  }

  private incrementCount(): void {
    this.logCount++;
  }

  log = (...args: any[]): void => {
    if (this.shouldLog()) {
      this.incrementCount();
      this.originalConsole.log(...args);
    }
  };

  debug = (...args: any[]): void => {
    if (this.shouldLog()) {
      this.incrementCount();
      this.originalConsole.debug(...args);
    }
  };

  info = (...args: any[]): void => {
    if (this.shouldLog()) {
      this.incrementCount();
      this.originalConsole.info(...args);
    }
  };

  warn = (...args: any[]): void => {
    // Always allow warnings, but limit them
    if (this.isDevelopment || this.logCount < 10) {
      this.incrementCount();
      this.originalConsole.warn(...args);
    }
  };

  error = (...args: any[]): void => {
    // Always allow errors - critical for debugging
    this.originalConsole.error(...args);
  };

  // Utility methods
  clear = (): void => {
    if (this.isDevelopment && console.clear) {
      console.clear();
    }
    this.logCount = 0;
  };

  getStats = (): { logCount: number; maxLogs: number; isDevelopment: boolean } => {
    return {
      logCount: this.logCount,
      maxLogs: this.maxLogs,
      isDevelopment: this.isDevelopment,
    };
  };
}

// Override console methods globally
function overrideConsole(): void {
  if (!__DEV__) {
    // In production, severely limit console output
    const safeConsole = new ProductionSafeConsole();
    
    // Override global console methods
    global.console = {
      ...console,
      log: safeConsole.log,
      debug: safeConsole.debug,
      info: safeConsole.info,
      warn: safeConsole.warn,
      error: safeConsole.error,
      clear: safeConsole.clear,
    };
    
    // Add a marker that console has been overridden
    (global.console as any).__overridden = true;
    (global.console as any).getStats = safeConsole.getStats;
  }
}

export default overrideConsole;
