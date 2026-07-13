import * as dotenv from 'dotenv';
import { initializeApp, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config({ path: '.env.local' });

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

  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else {
    throw new Error("Missing Firebase Admin credentials in .env.local");
  }
}

const adminDb = getFirestore(app, "default");

async function checkPayments() {
  const contactsRef = adminDb.collection("contacts");
  const snapshot = await contactsRef.get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const events = data.events || [];
    
    for (const event of events) {
      if (event.text && event.text.includes("תשלום")) {
        console.log(`Contact: ${data.conta_name}`);
        console.log(`Event Title: ${event.title}`);
        console.log(`Event Text: ${event.text}`);
        console.log("------------------------");
      }
    }
  }
}

checkPayments()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
