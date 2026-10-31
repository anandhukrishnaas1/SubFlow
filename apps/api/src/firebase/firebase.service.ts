import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { MockFirestore } from './mock-firestore';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App;
  private auth: admin.auth.Auth;
  private db: any;
  private storage: admin.storage.Storage;
  private isMock = false;

  onModuleInit() {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'subflow-demo';

    // Option 1: Individual env variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
    if (clientEmail && privateKey) {
      try {
        this.app = admin.apps.length
          ? admin.app()
          : admin.initializeApp({
              credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
              }),
              projectId,
              storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
            });
        this.auth = admin.auth(this.app);
        this.db = admin.firestore(this.app);
        this.storage = admin.storage(this.app);
        this.logger.log(`Initialized Firebase Admin with Client Email & Private Key for project: ${projectId}`);
        return;
      } catch (e) {
        this.logger.warn(`Failed initializing with FIREBASE_CLIENT_EMAIL/PRIVATE_KEY: ${e.message}`);
      }
    }

    // Option 2: Service account JSON string or file path
    if (serviceAccountJson) {
      try {
        const credentials = serviceAccountJson.trim().startsWith('{')
          ? JSON.parse(serviceAccountJson)
          : require('fs').readFileSync(serviceAccountJson, 'utf8') &&
            JSON.parse(require('fs').readFileSync(serviceAccountJson, 'utf8'));
        this.app = admin.apps.length
          ? admin.app()
          : admin.initializeApp({
              credential: admin.credential.cert(credentials),
              projectId: credentials.project_id || projectId,
              storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${credentials.project_id || projectId}.appspot.com`,
            });
        this.auth = admin.auth(this.app);
        this.db = admin.firestore(this.app);
        this.storage = admin.storage(this.app);
        this.logger.log(`Initialized Firebase Admin with Service Account for project: ${credentials.project_id || projectId}`);
        return;
      } catch (e) {
        this.logger.warn(`Failed parsing FIREBASE_SERVICE_ACCOUNT_KEY: ${e.message}`);
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

    // High performance in-memory mock engine with full Firestore API interface
    this.isMock = true;
    this.db = new MockFirestore();
    this.logger.log(`Initialized SubFlow In-Memory Firestore Engine (Dev Mode) with pre-seeded domain records`);
  }

  getAuth(): admin.auth.Auth {
    return this.auth;
  }

  getFirestore(): admin.firestore.Firestore {
    return this.db as any;
  }

  getStorage(): admin.storage.Storage {
    return this.storage;
  }
}
