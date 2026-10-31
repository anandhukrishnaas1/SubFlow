import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRequestContext, runWithRequestContext } from './request-context';

test('request context validates inbound identifiers and exposes response headers', () => {
  const headers: Record<string, string> = {};
  const response = { setHeader: (name: string, value: string) => (headers[name] = value) };
  const request = {
    headers: {
      'x-request-id': 'req-123',
      'x-correlation-id': 'corr-456',
    },
  } as never;
  let context: ReturnType<typeof getRequestContext>;
  runWithRequestContext(request, response as never, () => {
    context = getRequestContext();
  });
  assert.equal(context!.requestId, 'req-123');
  assert.equal(context!.correlationId, 'corr-456');
  assert.equal(headers['x-request-id'], 'req-123');
  assert.equal(headers['x-correlation-id'], 'corr-456');
});

test('invalid request identifiers are replaced', () => {
  const headers: Record<string, string> = {};
  const response = { setHeader: (name: string, value: string) => (headers[name] = value) };
  const request = { headers: { 'x-request-id': 'bad id\ninjected' } } as never;
  runWithRequestContext(request, response as never, () => {
    assert.ok(getRequestContext()?.requestId);
  });
  assert.notEqual(headers['x-request-id'], 'bad id\ninjected');
});
