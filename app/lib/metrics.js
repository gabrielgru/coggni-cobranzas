// app/lib/metrics.js - Sistema ligero de métricas para el middleware

class MiddlewareMetrics {
  constructor() {
    // Buffer en memoria para acumular métricas
    this.buffer = [];
    this.maxBufferSize = 100;
    this.flushInterval = null;
    
    // Iniciar flush automático cada 30 segundos
    if (typeof setInterval !== 'undefined') {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, 30000);
    }
  }

  track(event, properties = {}) {
    const metric = {
      event,
      timestamp: Date.now(),
      env: process.env.NODE_ENV || 'development',
      ...properties
    };

    this.buffer.push(metric);

    // Flush si el buffer está lleno
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const metrics = [...this.buffer];
    this.buffer = [];

    try {
      // Log estructurado para Vercel Functions
      console.log(JSON.stringify({
        type: 'metrics_batch',
        timestamp: new Date().toISOString(),
        count: metrics.length,
        summary: this.summarizeMetrics(metrics),
        metrics: process.env.NODE_ENV === 'development' ? metrics : undefined
      }));

      // En producción, podrías enviar a un servicio de analytics
      if (process.env.NODE_ENV === 'production' && process.env.ANALYTICS_ENDPOINT) {
        // fetch(process.env.ANALYTICS_ENDPOINT, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ metrics })
        // }).catch(console.error);
      }
    } catch (error) {
      console.error('[Metrics] Flush error:', error);
    }
  }

  summarizeMetrics(metrics) {
    const summary = {
      cache_hits: 0,
      cache_misses: 0,
      session_timeouts: 0,
      errors: 0,
      avg_duration: 0,
      max_duration: 0,
      total_requests: 0
    };

    let totalDuration = 0;

    metrics.forEach(metric => {
      switch (metric.event) {
        case 'middleware_cache_hit':
          summary.cache_hits++;
          break;
        case 'middleware_cache_miss':
          summary.cache_misses++;
          break;
        case 'middleware_session_timeout':
          summary.session_timeouts++;
          break;
        case 'middleware_error':
          summary.errors++;
          break;
        case 'middleware_performance':
          summary.total_requests++;
          totalDuration += metric.duration || 0;
          summary.max_duration = Math.max(summary.max_duration, metric.duration || 0);
          break;
      }
    });

    if (summary.total_requests > 0) {
      summary.avg_duration = Math.round(totalDuration / summary.total_requests);
    }

    // Calcular cache hit rate
    const totalCacheChecks = summary.cache_hits + summary.cache_misses;
    summary.cache_hit_rate = totalCacheChecks > 0 
      ? Math.round((summary.cache_hits / totalCacheChecks) * 100) 
      : 0;

    return summary;
  }

  // Métricas específicas del middleware
  trackCacheHit(pathname) {
    this.track('middleware_cache_hit', { pathname });
  }

  trackCacheMiss(pathname, reason) {
    this.track('middleware_cache_miss', { pathname, reason });
  }

  trackSessionTimeout(pathname) {
    this.track('middleware_session_timeout', { pathname });
  }

  trackPerformance(pathname, duration) {
    this.track('middleware_performance', { 
      pathname, 
      duration,
      slow: duration > 100 // Marcar requests lentas
    });
  }

  // Limpiar interval al destruir
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Singleton para usar en el middleware
export const metrics = new MiddlewareMetrics();

// Flush final en caso de shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    metrics.destroy();
  });
}