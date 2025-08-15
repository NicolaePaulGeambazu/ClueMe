// Performance monitoring utilities for family reminders

interface PerformanceMetrics {
  loadTime: number;
  cacheHitRate: number;
  queryCount: number;
  familySize: number;
  timestamp: number;
}

interface PerformanceArgs {
  memberCount?: number;
  [key: string]: unknown;
}

interface DecoratorTarget {
  [key: string]: unknown;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 measurements
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  // Track reminder loading performance
  trackReminderLoad(
    loadTime: number,
    cacheHit: boolean,
    queryCount: number,
    familySize: number
  ): void {
    const metric: PerformanceMetrics = {
      loadTime,
      cacheHitRate: cacheHit ? 1 : 0,
      queryCount,
      familySize,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log performance warnings
    this.checkPerformanceWarnings(metric);

    // Track performance with analytics (safely)
    try {
      // analyticsService.trackPerformance('reminder_load', metric.loadTime, {
      //   cacheHit: metric.cacheHitRate,
      //   queryCount: metric.queryCount,
      //   familySize: metric.familySize,
      // });
    } catch (error) {
      // Silent fail for analytics
    }
  }

  // Check for performance issues and log warnings
  checkPerformanceWarnings(metric: PerformanceMetrics): void {
    const now = Date.now();
    const duration = now - this.startTime;

    if (metric.loadTime > 3000) {
      if (__DEV__) {
        // Development logging removed
      }
      try {
        // analyticsService.trackPerformance('performance_warning', duration, {
        //   details: `⚠️ Slow reminder load: ${metric.loadTime}ms for family size ${metric.familySize}`,
        // });
      } catch (error) {
        // Silent fail for analytics
      }
    }

    if (metric.queryCount > 10) {
      if (__DEV__) {
        // Development logging removed
      }
      try {
        // analyticsService.trackPerformance('performance_warning', duration, {
        //   details: `⚠️ Too many queries: ${metric.queryCount} queries for family size ${metric.familySize}`,
        // });
      } catch (error) {
        // Silent fail for analytics
      }
    }

    if (metric.familySize > 20) {
      if (__DEV__) {
        // Development logging removed
      }
      try {
        // analyticsService.trackPerformance('performance_warning', duration, {
        //   details: `⚠️ Large family detected: ${metric.familySize} members - consider pagination`,
        // });
      } catch (error) {
        // Silent fail for analytics
      }
    }
  }

  // Get performance statistics
  getStats(): {
    averageLoadTime: number;
    averageCacheHitRate: number;
    averageQueryCount: number;
    totalMeasurements: number;
    recentMetrics: PerformanceMetrics[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageLoadTime: 0,
        averageCacheHitRate: 0,
        averageQueryCount: 0,
        totalMeasurements: 0,
        recentMetrics: [],
      };
    }

    const recentMetrics = this.metrics.slice(-10); // Last 10 measurements
    const averageLoadTime = this.metrics.reduce((sum, m) => sum + m.loadTime, 0) / this.metrics.length;
    const averageCacheHitRate = this.metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / this.metrics.length;
    const averageQueryCount = this.metrics.reduce((sum, m) => sum + m.queryCount, 0) / this.metrics.length;

    return {
      averageLoadTime,
      averageCacheHitRate,
      averageQueryCount,
      totalMeasurements: this.metrics.length,
      recentMetrics,
    };
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
  }

  // Get recommendations based on performance data
  getRecommendations(): string[] {
    const stats = this.getStats();
    const recommendations: string[] = [];

    if (stats.averageLoadTime > 2000) {
      recommendations.push('Consider implementing more aggressive caching');
    }

    if (stats.averageCacheHitRate < 0.5) {
      recommendations.push('Cache hit rate is low - consider increasing cache duration');
    }

    if (stats.averageQueryCount > 5) {
      recommendations.push('Too many queries - consider batch operations');
    }

    if (stats.recentMetrics.some(m => m.familySize > 15)) {
      recommendations.push('Large families detected - consider implementing virtual scrolling');
    }

    return recommendations;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance tracking decorator
export const trackPerformance = (operation: string) => {
  return (target: DecoratorTarget, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: PerformanceArgs[]) {
      const startTime = Date.now();
      try {
        const result = await method.apply(this, args);
        const loadTime = Date.now() - startTime;

        // Extract family size from arguments if available
        const familySize = args.find(arg => arg?.memberCount)?.memberCount || 0;

        performanceMonitor.trackReminderLoad(loadTime, false, 1, familySize);

        return result;
      } catch (error) {
        const loadTime = Date.now() - startTime;
        performanceMonitor.trackReminderLoad(loadTime, false, 1, 0);
        throw error;
      }
    };

    return descriptor;
  };
};

// Utility function to measure performance
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  familySize: number = 0
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await operation();
    const loadTime = Date.now() - startTime;
    performanceMonitor.trackReminderLoad(loadTime, false, 1, familySize);
    return result;
  } catch (error) {
    const loadTime = Date.now() - startTime;
    performanceMonitor.trackReminderLoad(loadTime, false, 1, familySize);
    throw error;
  }
};
