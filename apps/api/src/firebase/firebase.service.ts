import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { MockFirestore } from './mock-firestore';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app?: admin.app.App;
  private auth?: admin.auth.Auth;
  private db: any;
  private storage?: admin.storage.Storage;
  private isMock = false;

  onModuleInit() {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'subflow-demo';

    if (serviceAccountJson) {
      try {
        const credentials = JSON.parse(serviceAccountJson);
        this.app = admin.apps.length
          ? admin.app()
          : admin.initializeApp({
              credential: admin.credential.cert(credentials),
              projectId,
              storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
            });
        this.auth = admin.auth(this.app);
        this.db = admin.firestore(this.app);
        this.storage = admin.storage(this.app);
        this.logger.log(`Initialized Firebase Admin with Service Account for project: ${projectId}`);
        return;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this.logger.error(`Failed initializing Firebase from FIREBASE_SERVICE_ACCOUNT_KEY: ${message}`);
        if (process.env.NODE_ENV === 'production') {
          throw e;
        }
      }
    }

    if (emulatorHost) {
      this.app = admin.apps.length
        ? admin.app()
        : admin.initializeApp({
            projectId,
            storageBucket: `${projectId}.appspot.com`,
          });
      this.auth = admin.auth(this.app);
      this.db = admin.firestore(this.app);
      this.storage = admin.storage(this.app);
      this.logger.log(`Initialized Firebase Admin connected to Firestore emulator at ${emulatorHost}`);
      return;
    }

    if (
      process.env.NODE_ENV === 'development' &&
      process.env.SUBFLOW_MOCK_FIRESTORE === 'true'
    ) {
      this.isMock = true;
      this.db = new MockFirestore();
      this.logger.warn('Initialized explicitly enabled in-memory Firestore mock.');
      return;
    }

    throw new Error(
      'Firebase is not configured. Configure FIREBASE_SERVICE_ACCOUNT_KEY or FIRESTORE_EMULATOR_HOST; the mock requires SUBFLOW_MOCK_FIRESTORE=true in development.',
    );
  }

  getAuth(): admin.auth.Auth {
    if (!this.auth) {
      throw new Error('Firebase Authentication is unavailable in Firestore mock mode.');
    }
    return this.auth;
  }

  getFirestore(): admin.firestore.Firestore {
    if (!this.db) {
      throw new Error('Firestore has not been initialized.');
    }
    return this.db as admin.firestore.Firestore;
  }

  getStorage(): admin.storage.Storage {
    if (!this.storage) {
      throw new Error('Firebase Storage is unavailable until Firebase is configured.');
    }
    return this.storage;
  }

  get isMockFirestore(): boolean {
    return this.isMock;
  }
}
