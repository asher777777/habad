import { adminDb } from "../src/lib/firebase-admin";

async function checkMissingLastName() {
  const submissionsRef = adminDb.collection("form_submissions");
  const snap = await submissionsRef.where("formName", "==", "הבטיחו את מקום ילדכם עוד היום!").get();
  
  let missingCount = 0;
  for (const doc of snap.docs) {
    const payload = doc.data().payload || {};
    if (!payload["שם משפחה"]) {
      console.log(`Missing last name for contactId ${doc.data().contactId}. Payload:`, payload);
      missingCount++;
    }
  }
  console.log(`Total missing last name: ${missingCount}`);
}

checkMissingLastName().catch(console.error);
