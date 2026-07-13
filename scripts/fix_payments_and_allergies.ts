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

async function fixPaymentsAndAllergies() {
  const contactsRef = adminDb.collection("contacts");
  const snapshot = await contactsRef.get();
  
  let processed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const events = data.events || [];
    let children: any[] = data.children || [];
    let modified = false;
    
    let totalSpent = 0;
    let orderCount = 0;
    let lastOrderDate = "";

    for (const event of events) {
      if (!event.text) continue;
      
      // Calculate Payments
      let amount = 0;
      
      // Match "סכום: 980 ש"ח. סטטוס: תשלום בוצע."
      const regex1 = /סכום:\s*([\d.]+)\s*ש"ח\.\s*סטטוס:\s*תשלום בוצע\./;
      const match1 = event.text.match(regex1);
      if (match1) {
        amount = parseFloat(match1[1]);
      } else {
        // Match "התקבל תשלום בהצלחה על סך 980 ש"ח"
        const regex2 = /התקבל תשלום בהצלחה על סך\s*([\d.]+)\s*ש"ח/;
        const match2 = event.text.match(regex2);
        if (match2) {
          amount = parseFloat(match2[1]);
        }
      }
      
      if (amount > 0) {
        totalSpent += amount;
        orderCount++;
        // Use event.time or a fallback
        if (event.time) {
          if (!lastOrderDate || new Date(event.time) > new Date(lastOrderDate)) {
            lastOrderDate = event.time;
          }
        }
      }
      
      // Extract Form Data for Allergies and Health Declaration
      const jsonStart = event.text.indexOf("ערכי שדות: {");
      if (jsonStart !== -1) {
        try {
          const jsonString = event.text.substring(jsonStart + 11);
          const formData = JSON.parse(jsonString);

          const firstName = formData["שם פרטי של הילד"] || formData["שם הילד/ה"] || formData["שם הילד"] || "";
          const idNumber = formData["תעודת זהות"] || formData["ת.ז"] || "";
          
          const allergiesHas = formData["קיימת רגישות כלשהי?"] || formData["האם לילד/ה יש רגישות/אלרגיה כלשהי?"] || formData["רגישות/אלרגיה"] || "";
          const allergiesDetails = formData["במידה וכן נא לפרט:"] || formData["פירוט רגישות"] || formData["פירוט הרגישות"] || "";
          const healthDeclaration = formData["אישור הצהרת בריאות"] || "";
          
          if (firstName || idNumber) {
            const childIndex = children.findIndex(c => 
              (idNumber && c.id_number === idNumber) || 
              (!idNumber && firstName && c.first_name === firstName.trim())
            );

            if (childIndex !== -1) {
              if (allergiesHas) children[childIndex].allergies_has = allergiesHas;
              if (allergiesDetails) children[childIndex].allergies_details = allergiesDetails;
              if (healthDeclaration) children[childIndex].health_declaration = healthDeclaration;
              modified = true;
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }
    
    // Only update if there's a change or if payments were found
    if (totalSpent > 0 || modified) {
      const updateData: any = {};
      if (totalSpent > 0) {
        updateData.total_spent = totalSpent;
        updateData.order_count = orderCount;
        if (lastOrderDate) updateData.last_order_date = lastOrderDate;
      }
      if (modified) {
        updateData.children = children;
      }
      await contactsRef.doc(doc.id).update(updateData);
      processed++;
      console.log(`Updated contact ${data.conta_name}: spent ${totalSpent}, orders ${orderCount}, modified children: ${modified}`);
    }
  }

  console.log(`Finished processing. Updated ${processed} contacts.`);
}

fixPaymentsAndAllergies()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
