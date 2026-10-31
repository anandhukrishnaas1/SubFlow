import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

function createContext(headers: Record<string, string>, request: Record<string, unknown>) {
  request.headers = headers;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('FirebaseAuthGuard mock authentication', () => {
  it('accepts mock identities only when development mock auth is explicitly enabled', async () => {
    const previousEnvironment = process.env.NODE_ENV;
    const previousMockAuth = process.env.SUBFLOW_ENABLE_MOCK_AUTH;
    process.env.NODE_ENV = 'development';
    process.env.SUBFLOW_ENABLE_MOCK_AUTH = 'true';
    const firebase = {
      isMockFirestore: true,
      getAuth: () => {
        throw new Error('Mock authentication must not call Firebase Auth.');
      },
    } as unknown as FirebaseService;
    const request: Record<string, unknown> = {};

    try {
      const allowed = await new FirebaseAuthGuard(firebase).canActivate(
        createContext({ 'x-mock-role': 'staff', 'x-mock-uid': 'staff-1' }, request),
      );
      assert.equal(allowed, true);
      assert.equal((request.user as { role: string }).role, 'staff');

      await assert.rejects(
        () =>
          new FirebaseAuthGuard(firebase).canActivate(
            createContext({ 'x-mock-role': 'owner' }, {}),
          ),
        UnauthorizedException,
      );
    } finally {
      if (previousEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnvironment;
      if (previousMockAuth === undefined) delete process.env.SUBFLOW_ENABLE_MOCK_AUTH;
      else process.env.SUBFLOW_ENABLE_MOCK_AUTH = previousMockAuth;
    }
  });

  it('does not accept the demo token in production', async () => {
    const previousEnvironment = process.env.NODE_ENV;
    const previousMockAuth = process.env.SUBFLOW_ENABLE_MOCK_AUTH;
    process.env.NODE_ENV = 'production';
    process.env.SUBFLOW_ENABLE_MOCK_AUTH = 'true';
    const firebase = {
      isMockFirestore: true,
      getAuth: () => ({
        verifyIdToken: async () => {
          throw new Error('Invalid token');
        },
      }),
    } as unknown as FirebaseService;

    try {
      await assert.rejects(
        () =>
          new FirebaseAuthGuard(firebase).canActivate(
            createContext({ 'x-mock-role': 'admin' }, {}),
          ),
        UnauthorizedException,
      );
      await assert.rejects(
        () =>
          new FirebaseAuthGuard(firebase).canActivate(
            createContext({ authorization: 'Bearer demo-admin-token' }, {}),
          ),
        UnauthorizedException,
      );
    } finally {
      if (previousEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnvironment;
      if (previousMockAuth === undefined) delete process.env.SUBFLOW_ENABLE_MOCK_AUTH;
      else process.env.SUBFLOW_ENABLE_MOCK_AUTH = previousMockAuth;
    }
  });

  it('rejects Firebase tokens with an unsupported role claim', async () => {
    const previousEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const firebase = {
      isMockFirestore: false,
      getAuth: () => ({
        verifyIdToken: async () => ({
          uid: 'user-1',
          role: 'owner',
        }),
      }),
    } as unknown as FirebaseService;

    try {
      await assert.rejects(
        () =>
          new FirebaseAuthGuard(firebase).canActivate(
            createContext({ authorization: 'Bearer valid-token' }, {}),
          ),
        UnauthorizedException,
      );
    } finally {
      if (previousEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnvironment;
    }
  });
});
