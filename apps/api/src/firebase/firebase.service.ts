import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App;
  private auth: admin.auth.Auth;
  private db: admin.firestore.Firestore;
  private storage: admin.storage.Storage;

  onModuleInit() {
    if (!admin.apps.length) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const projectId = process.env.FIREBASE_PROJECT_ID || 'subflow-demo';

      if (serviceAccountJson) {
        try {
          const credentials = JSON.parse(serviceAccountJson);
          this.app = admin.initializeApp({
            credential: admin.credential.cert(credentials),
            projectId,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
          });
          this.logger.log(`Initialized Firebase Admin with Service Account for project: ${projectId}`);
        } catch (e) {
          this.logger.warn(`Failed parsing FIREBASE_SERVICE_ACCOUNT_KEY, falling back to default credentials: ${e.message}`);
          this.app = admin.initializeApp({
            projectId,
            storageBucket: `${projectId}.appspot.com`,
          });
        }
      } else {
        this.app = admin.initializeApp({
          projectId,
          storageBucket: `${projectId}.appspot.com`,
        });
        this.logger.log(`Initialized Firebase Admin in development mode for project: ${projectId}`);
      }
    } else {
      this.app = admin.app();
    }

    this.auth = admin.auth(this.app);
    this.db = admin.firestore(this.app);
    this.storage = admin.storage(this.app);
  }

  getAuth(): admin.auth.Auth {
    return this.auth;
  }

  getFirestore(): admin.firestore.Firestore {
    return this.db;
  }

  getStorage(): admin.storage.Storage {
    return this.storage;
  }
}
