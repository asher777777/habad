import * as dotenv from 'dotenv';
import { initializeApp, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

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

async function rescueChildren() {
  console.log("Starting rescue operation...");
  
  const contactsRef = adminDb.collection("contacts");
  const snapshot = await contactsRef.get();
  
  let totalRescued = 0;
  let totalProcessed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const events = data.events || [];
    let children: any[] = data.children || [];
    let modified = false;

    // First migrate flat child to children array if needed
    if (children.length === 0 && data.child_first_name) {
      children.push({
        id: crypto.randomUUID(),
        first_name: data.child_first_name,
        last_name: data.child_last_name || "",
        grade: data.child_grade || "",
        id_number: data.child_id_number || "",
        allergies_has: data.allergies_has || "",
        allergies_details: data.allergies_details || ""
      });
      modified = true;
      totalRescued++;
      console.log(`Migrated top-level child ${data.child_first_name} for parent ${data.conta_name}`);
    }

    for (const event of events) {
      if (!event.text) continue;
      
      // Look for JSON data in "ערכי שדות: "
      const jsonStart = event.text.indexOf("ערכי שדות: {");
      if (jsonStart !== -1) {
        try {
          const jsonString = event.text.substring(jsonStart + 11); // Length of "ערכי שדות: "
          const formData = JSON.parse(jsonString);

          const firstName = formData["שם פרטי של הילד"] || formData["שם הילד/ה"] || formData["שם הילד"];
          const lastName = formData["שם משפחה"];
          const idNumber = formData["תעודת זהות"] || formData["ת.ז"];
          const grade = formData["עולה לכיתה"] || formData["כיתה"];
          const allergiesHas = formData["האם לילד/ה יש רגישות/אלרגיה כלשהי?"] || formData["רגישות/אלרגיה"];
          const allergiesDetails = formData["במידה וכן נא לפרט:"] || formData["פירוט רגישות"];
          
          if (firstName || idNumber) {
            // Check if this child already exists in the children array
            const childExists = children.some(c => 
              (idNumber && c.id_number === idNumber) || 
              (!idNumber && firstName && c.first_name === firstName)
            );

            if (!childExists) {
              const newChild = {
                id: crypto.randomUUID(),
                first_name: firstName || "",
                last_name: lastName || "",
                grade: grade || "",
                id_number: idNumber || "",
                allergies_has: allergiesHas || "",
                allergies_details: allergiesDetails || ""
              };
              
              children.push(newChild);
              modified = true;
              totalRescued++;
              console.log(`Rescued child ${firstName} for parent ${data.conta_name}`);
            }
          }
        } catch (e) {
          // JSON parse failed or other error, skip
        }
      }
    }

    if (modified) {
      await contactsRef.doc(doc.id).update({ children });
      totalProcessed++;
    }
  }

  console.log(`Rescue operation complete!`);
  console.log(`Rescued ${totalRescued} children across ${totalProcessed} contacts.`);
}

rescueChildren()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
