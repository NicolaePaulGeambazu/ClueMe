// Logger utility for controlled debug output
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  showEmojis: boolean;
  showTimestamps: boolean;
  maxLogLength: number;
}

class Logger {
  private config: LoggerConfig = {
    enabled: __DEV__,
    level: 'info', // Default to info level to reduce noise
    showEmojis: true,
    showTimestamps: false,
    maxLogLength: 200
  };

  private logLevels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    verbose: 4
  };

  setConfig(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && this.logLevels[level] <= this.logLevels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    let formatted = '';
    
    if (this.config.showTimestamps) {
      formatted += `[${new Date().toISOString()}] `;
    }
    
    if (this.config.showEmojis) {
      const emojis: Record<LogLevel, string> = {
        error: '❌',
        warn: '⚠️',
        info: 'ℹ️',
        debug: '🔍',
        verbose: '🔬'
      };
      formatted += `${emojis[level]} `;
    }
    
    formatted += message;
    
    if (data !== undefined) {
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      if (dataStr.length > this.config.maxLogLength) {
        formatted += `: ${dataStr.substring(0, this.config.maxLogLength)}...`;
      } else {
        formatted += `: ${dataStr}`;
      }
    }
    
    return formatted;
  }

  error(message: string, data?: any) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  verbose(message: string, data?: any) {
    if (this.shouldLog('verbose')) {
      console.log(this.formatMessage('verbose', message, data));
    }
  }

  // Special methods for common patterns
  auth(message: string, data?: any) {
    this.info(`Auth: ${message}`, data);
  }

  firebase(message: string, data?: any) {
    this.info(`Firebase: ${message}`, data);
  }

  family(message: string, data?: any) {
    this.info(`Family: ${message}`, data);
  }

  reminders(message: string, data?: any) {
    this.info(`Reminders: ${message}`, data);
  }

  notifications(message: string, data?: any) {
    this.info(`Notifications: ${message}`, data);
  }

  navigation(message: string, data?: any) {
    this.info(`Navigation: ${message}`, data);
  }

  performance(message: string, data?: any) {
    this.info(`Performance: ${message}`, data);
  }
}

// Create singleton instance
const logger = new Logger();

// Export both the instance and the class
export default logger;
export { Logger, type LogLevel, type LoggerConfig }; 