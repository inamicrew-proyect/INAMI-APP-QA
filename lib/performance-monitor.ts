// Monitor de rendimiento para INAMI
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  startTimer(name: string): void {
    this.metrics.set(`${name}_start`, performance.now());
  }
  
  endTimer(name: string): number {
    const startTime = this.metrics.get(`${name}_start`);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    this.metrics.set(name, duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  getMetric(name: string): number {
    return this.metrics.get(name) || 0;
  }
  
  getAllMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    this.metrics.forEach((value, key) => {
      if (!key.includes('_start')) {
        result[key] = value;
      }
    });
    return result;
  }
  
  clearMetrics(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();