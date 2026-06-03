import { initializeApp, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

let app;

try {
  app = getApp();
} catch (e) {
  const privateKeyB64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
  let privateKey = "";
  
  if (privateKeyB64) {
    privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
      storageBucket,
    });
  } else {
    // In production Cloud Functions environment, initialize using default credentials
    app = initializeApp({
      projectId: "desborecontrol",
      storageBucket,
    });
  }
}

const adminDb = getFirestore(app, "default");
const adminAuth = getAuth(app);
const adminStorage = getStorage(app);

export { adminDb, adminAuth, adminStorage };
