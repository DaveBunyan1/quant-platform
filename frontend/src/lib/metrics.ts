import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from './logger';

function sendToAnalytics(metric: Metric) {
  // TODO: POST to /api/client-metrics
  logger.info('web_vital', {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
  });
}

export function initWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
