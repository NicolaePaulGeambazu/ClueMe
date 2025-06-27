declare module 'react-native-background-job' {
  export interface BackgroundJobOptions {
    jobKey: string;
    job: () => Promise<void> | void;
  }

  export interface ScheduleOptions {
    jobKey: string;
    period: number;
    networkType?: number;
    requiresCharging?: boolean;
    requiresDeviceIdle?: boolean;
    persist?: boolean;
  }

  export interface CancelOptions {
    jobKey: string;
  }

  export const NETWORK_TYPE_ANY: number;
  export const NETWORK_TYPE_UNMETERED: number;
  export const NETWORK_TYPE_NOT_ROAMING: number;
  export const NETWORK_TYPE_METERED: number;

  export function register(options: BackgroundJobOptions): void;
  export function schedule(options: ScheduleOptions): Promise<void>;
  export function cancel(options: CancelOptions): Promise<void>;
} 