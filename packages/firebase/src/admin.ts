import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

export function getFirebaseAdmin(): {
  adminApp: admin.app.App;
  adminAuth: admin.auth.Auth;
  adminDb: admin.firestore.Firestore;
  adminStorage: admin.storage.Storage;
} {
  if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'subflow-demo';

    if (serviceAccountJson) {
      try {
        const credentials = JSON.parse(serviceAccountJson);
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(credentials),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
          projectId: projectId,
        });
      } catch (err) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to default credentials:', err);
        adminApp = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId,
          storageBucket: `${projectId}.appspot.com`,
        });
      }
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
