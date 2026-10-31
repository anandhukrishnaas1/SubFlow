import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
  correlationId: string;
}

interface RequestLike {
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
  correlationId?: string;
}

interface ResponseLike {
  setHeader(name: string, value: string): void;
}

const requestContextStorage = new AsyncLocalStorage<RequestContext>();
const VALID_ID = /^[A-Za-z0-9._:-]{1,128}$/;

function getHeader(value: string | string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && VALID_ID.test(candidate) ? candidate : undefined;
}

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export function runWithRequestContext(
  request: RequestLike,
  response: ResponseLike,
  next: () => void,
): void {
  const requestId = getHeader(request.headers['x-request-id']) || randomUUID();
  const correlationId =
    getHeader(request.headers['x-correlation-id']) || requestId;
  const context = { requestId, correlationId };

  request.requestId = requestId;
  request.correlationId = correlationId;
  response.setHeader('x-request-id', requestId);
  response.setHeader('x-correlation-id', correlationId);

  requestContextStorage.run(context, next);
}
