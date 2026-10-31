import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
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
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    let projectId = process.env.FIREBASE_PROJECT_ID || 'subflow-demo';

    let credentials: any = null;

    if (serviceAccountJson) {
      try {
        credentials = JSON.parse(serviceAccountJson);
      } catch (e: any) {
        this.logger.warn(`Failed parsing FIREBASE_SERVICE_ACCOUNT_KEY: ${e.message}`);
      }
    }

    if (!credentials) {
      const candidates = [
        serviceAccountPath,
        path.resolve(process.cwd(), 'firebase-service-account.json'),
        path.resolve(process.cwd(), '../../firebase-service-account.json'),
        path.resolve(__dirname, '../../../../firebase-service-account.json'),
      ].filter(Boolean) as string[];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          try {
            credentials = JSON.parse(fs.readFileSync(candidate, 'utf8'));
            this.logger.log(`Found Firebase service account file at: ${candidate}`);
            break;
          } catch (e: any) {
            this.logger.warn(`Failed reading credentials from ${candidate}: ${e.message}`);
          }
        }
      }
    }

    if (credentials) {
      projectId = credentials.project_id || projectId;
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
      this.logger.log(`🔥 Initialized Firebase Admin connected to LIVE project: ${projectId}`);
      return;
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
