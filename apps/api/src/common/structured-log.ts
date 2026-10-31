import { Logger } from '@nestjs/common';
import { getRequestContext } from './request-context';

const logger = new Logger('HTTP');

export function writeStructuredLog(
  level: 'log' | 'warn' | 'error',
  fields: Record<string, string | number | undefined>,
): void {
  const context = getRequestContext();
  const record = {
    timestamp: new Date().toISOString(),
    ...context,
    ...fields,
  };
  logger[level](JSON.stringify(record));
}
