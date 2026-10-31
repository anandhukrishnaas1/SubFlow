import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';

function createContext(headers: Record<string, string>) {
  const request: Record<string, any> = { headers };
  return {
    request,
    context: {
      switchToHttp: () => ({ getRequest: () => request }),
    } as never,
  };
}

async function withEnv(
  values: Record<string, string | undefined>,
  action: () => Promise<void>,
) {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('mock headers are rejected outside explicitly enabled development mock mode', async () => {
  const firebase = { isMockFirestore: true } as never;
  const guard = new FirebaseAuthGuard(firebase);
  const { context } = createContext({ 'x-mock-role': 'admin' });
  await withEnv(
    {
      NODE_ENV: 'production',
      SUBFLOW_ENABLE_MOCK_AUTH: 'true',
    },
    async () => {
      await assert.rejects(guard.canActivate(context), UnauthorizedException);
    },
  );
});

test('development mock auth requires both feature flags and rejects unknown roles', async () => {
  const guard = new FirebaseAuthGuard({
    isMockFirestore: true,
    getAuth: () => ({ verifyIdToken: async () => { throw new Error('invalid token'); } }),
  } as never);
  const enabled = createContext({ 'x-mock-role': 'admin', 'x-mock-uid': 'admin-1' });
  await withEnv(
    {
      NODE_ENV: 'development',
      SUBFLOW_ENABLE_MOCK_AUTH: 'true',
    },
    async () => {
      assert.equal(await guard.canActivate(enabled.context), true);
      assert.equal(enabled.request.user.uid, 'admin-1');
      assert.equal(enabled.request.user.role, 'admin');

      const invalid = createContext({ 'x-mock-role': 'root' });
      await assert.rejects(guard.canActivate(invalid.context), UnauthorizedException);
    },
  );
});

test('a configured mock header cannot bypass production even with a demo bearer token', async () => {
  const guard = new FirebaseAuthGuard({
    isMockFirestore: true,
    getAuth: () => ({ verifyIdToken: async () => { throw new Error('invalid token'); } }),
  } as never);
  const { context } = createContext({
    authorization: 'Bearer demo-admin-token',
    'x-mock-role': 'admin',
  });
  await withEnv(
    {
      NODE_ENV: 'production',
      SUBFLOW_ENABLE_MOCK_AUTH: 'true',
    },
    async () => {
      await assert.rejects(guard.canActivate(context), UnauthorizedException);
    },
  );
});
