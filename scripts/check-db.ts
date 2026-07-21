import { adminDb } from "../src/lib/firebase-admin";

async function main() {
  const submissionsRef = adminDb.collection("form_submissions");
  const snap = await submissionsRef.where("formName", "==", "הבטיחו את מקום ילדכם עוד היום!").get();
  
  console.log(`Found ${snap.size} records.`);
  if (snap.size > 0) {
    console.log("First record:");
    console.log(JSON.stringify(snap.docs[0].data(), null, 2));
  }
}

main().catch(console.error);
