import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

let app: App;

if (!getApps().length) {
  try {
    // Try to get service account from environment variable first
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    let serviceAccount = null;
    
    if (serviceAccountKey) {
      if (serviceAccountKey.startsWith('{')) {
        // It's JSON content
        try {
          serviceAccount = JSON.parse(serviceAccountKey);
        } catch (error) {
          console.warn('⚠️ Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY');
        }
      } else {
        // It's a file path
        const serviceAccountPath = path.isAbsolute(serviceAccountKey) 
          ? serviceAccountKey 
          : path.join(process.cwd(), serviceAccountKey);
        
        if (fs.existsSync(serviceAccountPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        }
      }
    }
    
    // If no service account from env, try the default file path
    if (!serviceAccount) {
      const defaultServiceAccountPath = path.join(process.cwd(), 'solotype-23c1f-firebase-adminsdk-fbsvc-c02945eb94.json');
      if (fs.existsSync(defaultServiceAccountPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(defaultServiceAccountPath, 'utf8'));
        console.log('✅ Using service account from default file path');
      }
    }
    
    if (serviceAccount) {
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: 'solotype-23c1f',
      });
      console.log('✅ Firebase Admin SDK initialized with service account');
    } else {
      // Fallback to default credentials (works in Firebase Functions and Google Cloud)
      console.warn('⚠️ Service account not found, using default credentials');
      app = initializeApp({
        projectId: 'solotype-23c1f',
      });
    }
    
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    
    // Final fallback - try with minimal config
    try {
      app = initializeApp({
        projectId: 'solotype-23c1f',
      });
      console.log('✅ Firebase Admin SDK initialized with minimal config');
    } catch (fallbackError) {
      console.error('❌ All Firebase Admin SDK initialization attempts failed:', fallbackError);
      throw fallbackError;
    }
  }
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };