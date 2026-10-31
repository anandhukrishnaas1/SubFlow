import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: admin.app.App;

export function getFirebaseAdmin(): {
  adminApp: admin.app.App;
  adminAuth: admin.auth.Auth;
  adminDb: admin.firestore.Firestore;
  adminStorage: admin.storage.Storage;
} {
  if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    let projectId = process.env.FIREBASE_PROJECT_ID || 'subflow-demo';

    let credentials: any = null;

    if (serviceAccountJson) {
      try {
        credentials = JSON.parse(serviceAccountJson);
      } catch (err) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err);
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
            break;
          } catch {
            // Ignore error and continue candidate search
          }
        }
      }
    }

    if (credentials) {
      projectId = credentials.project_id || projectId;
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(credentials),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
        projectId,
      });
    } else {
      adminApp = admin.initializeApp({
        projectId,
        storageBucket: `${projectId}.appspot.com`,
      });
    }
  } else {
    adminApp = admin.app();
  }

  const adminAuth = admin.auth(adminApp);
  const adminDb = admin.firestore(adminApp);
  const adminStorage = admin.storage(adminApp);

  return { adminApp, adminAuth, adminDb, adminStorage };
}

export { admin };
