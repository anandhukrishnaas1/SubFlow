import { getRequestContext } from './request-context';

export type LogLevel = 'info' | 'warn' | 'error';

export interface ApplicationLog {
  level: LogLevel;
  action: string;
  module: string;
  operation: string;
  status: string;
  message: string;
  durationMs?: number;
  errorCode?: string;
  httpMethod?: string;
  path?: string;
}

export function writeApplicationLog(fields: ApplicationLog): void {
  const context = getRequestContext();
  const record = {
    timestamp: new Date().toISOString(),
    level: fields.level,
    service: 'subflow-api',
    environment: process.env.NODE_ENV || 'development',
    requestId: context?.requestId,
    correlationId: context?.correlationId,
    ...fields,
  };

  if (process.env.NODE_ENV === 'production') {
    process.stdout.write(`${JSON.stringify(record)}\n`);
    return;
  }

  const { timestamp, level, action, module, operation, status, message } = record;
  process.stdout.write(
    `${timestamp} ${level.toUpperCase()} ${module}.${operation} ${status} ${action}: ${message}\n`,
  );
}
