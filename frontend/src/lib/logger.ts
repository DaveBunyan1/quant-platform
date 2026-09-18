type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const isDev = import.meta.env.DEV;

function emit(payload: LogPayload) {
  if (isDev) {
    const fn = console[payload.level] ?? console.log;
    fn(`[${payload.level}] ${payload.message}`, payload.context ?? '');
    return;
  }

  // TODO: POST to a backend endpoint later
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    emit({ level: 'debug', message, timestamp: new Date().toISOString(), context }),
  info: (message: string, context?: Record<string, unknown>) =>
    emit({ level: 'info', message, timestamp: new Date().toISOString(), context }),
  warn: (message: string, context?: Record<string, unknown>) =>
    emit({ level: 'warn', message, timestamp: new Date().toISOString(), context }),
  error: (message: string, context?: Record<string, unknown>) =>
    emit({ level: 'error', message, timestamp: new Date().toISOString(), context }),
};
