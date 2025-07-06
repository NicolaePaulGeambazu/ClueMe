// Mock Analytics Service - Firebase Analytics removed to fix build issues
export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
}

class AnalyticsService {
  initialize(): void {
    console.log('📊 Mock Analytics initialized');
  }

  trackScreen(screenName: string, screenClass?: string, parameters?: Record<string, any>): void {
    if (__DEV__) {
      console.log('📊 Screen tracked:', screenName, parameters);
    }
  }

  trackAction(action: string, parameters?: Record<string, any>): void {
    if (__DEV__) {
      console.log('📊 Action tracked:', action, parameters);
    }
  }

  trackFirebaseError(error: any, operation: string, context: string): void {
    if (__DEV__) {
      console.log('📊 Firebase error tracked:', operation, context, error);
    }
  }

  trackCustomEvent(eventName: string, parameters?: Record<string, any>): void {
    if (__DEV__) {
      console.log('📊 Custom event tracked:', eventName, parameters);
    }
  }

  trackAppLifecycle(lifecycle: string): void {
    if (__DEV__) {
      console.log('📊 App lifecycle tracked:', lifecycle);
    }
  }

  startTimer(timerName: string): void {
    if (__DEV__) {
      console.log('📊 Timer started:', timerName);
    }
  }

  endTimer(timerName: string, parameters?: Record<string, any>): void {
    if (__DEV__) {
      console.log('📊 Timer ended:', timerName, parameters);
    }
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService; 