import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
import { NextFunction, Request, Response } from 'express';

export interface RequestContext {
  requestId: string;
  correlationId: string;
}

const requestContext = new AsyncLocalStorage<RequestContext>();
const VALID_REQUEST_ID = /^[a-zA-Z0-9._-]{1,128}$/;

function getHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function validOrNew(value: string | undefined): string {
  return value && VALID_REQUEST_ID.test(value) ? value : randomUUID();
}

export function runWithRequestContext(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const requestId = validOrNew(getHeader(request.headers['x-request-id']));
  const correlationId = validOrNew(
    getHeader(request.headers['x-correlation-id']) || requestId,
  );
  const context = { requestId, correlationId };
  response.setHeader('x-request-id', requestId);
  response.setHeader('x-correlation-id', correlationId);
  requestContext.run(context, next);
}

export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}
