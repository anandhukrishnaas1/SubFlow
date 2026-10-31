import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { getRequestContext, runWithRequestContext } from './request-context';

describe('request context', () => {
  it('propagates validated request and correlation IDs across asynchronous work', async () => {
    const responseHeaders = new Map<string, string>();
    let asyncWork: Promise<void> | undefined;
    const request: {
      headers: Record<string, string>;
      requestId?: string;
      correlationId?: string;
    } = {
      headers: {
        'x-request-id': 'req-123',
        'x-correlation-id': 'trace-456',
      },
    };

    runWithRequestContext(
      request,
      { setHeader: (name, value) => responseHeaders.set(name, value) },
      () => {
        assert.deepEqual(getRequestContext(), {
          requestId: 'req-123',
          correlationId: 'trace-456',
        });
        asyncWork = Promise.resolve().then(() => {
          assert.deepEqual(getRequestContext(), {
            requestId: 'req-123',
            correlationId: 'trace-456',
          });
        });
      },
    );
    await asyncWork;

    assert.equal(responseHeaders.get('x-request-id'), 'req-123');
    assert.equal(responseHeaders.get('x-correlation-id'), 'trace-456');
    assert.equal(request.requestId, 'req-123');
  });

  it('replaces invalid incoming IDs with generated request context values', () => {
    const responseHeaders = new Map<string, string>();
    const request: {
      headers: Record<string, string>;
      requestId?: string;
      correlationId?: string;
    } = {
      headers: {
        'x-request-id': 'bad id',
        'x-correlation-id': 'x'.repeat(129),
      },
    };

    runWithRequestContext(
      request,
      { setHeader: (name, value) => responseHeaders.set(name, value) },
      () => {
        const context = getRequestContext();
        assert.ok(context);
        assert.notEqual(context.requestId, 'bad id');
        assert.equal(context.requestId, context.correlationId);
      },
    );

    assert.ok(responseHeaders.get('x-request-id'));
    assert.equal(
      responseHeaders.get('x-request-id'),
      responseHeaders.get('x-correlation-id'),
    );
  });
});
