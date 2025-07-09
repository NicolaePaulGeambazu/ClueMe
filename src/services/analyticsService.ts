// Mock Analytics Service - Firebase Analytics removed to fix build issues

interface AnalyticsParameters {
  [key: string]: string | number | boolean | null | undefined;
}

interface ErrorDetails {
  message?: string;
  code?: string;
  stack?: string;
  [key: string]: unknown;
}

interface PerformanceParameters extends AnalyticsParameters {
  duration?: number;
  timestamp?: number;
}

class AnalyticsService {
  private isInitialized = false;

  initialize(): void {
    this.isInitialized = true;
  }

  trackScreen(screenName: string, parameters?: AnalyticsParameters): void {
    // Track screen view
  }

  trackAction(action: string, parameters?: AnalyticsParameters): void {
    // Track user action
  }

  trackFirebaseError(operation: string, context: string, error: ErrorDetails): void {
    // Track Firebase errors
  }

  trackCustomEvent(eventName: string, parameters?: AnalyticsParameters): void {
    // Track custom events
  }

  trackAppLifecycle(lifecycle: 'foreground' | 'background' | 'terminate'): void {
    // Track app lifecycle events
  }

  startTimer(timerName: string): void {
    // Start performance timer
  }

  endTimer(timerName: string, parameters?: PerformanceParameters): void {
    // End performance timer
  }

  trackPerformance(eventName: string, duration: number, parameters?: PerformanceParameters): void {
    // Track performance metrics
  }

  trackError(errorKey: string, errorCode?: string, metadata?: AnalyticsParameters): void {
    // Track errors
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService; 