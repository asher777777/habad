import { adminDb } from "../src/lib/firebase-admin";

async function main() {
  const submissionsRef = adminDb.collection("form_submissions");
  const snap = await submissionsRef.where("formName", "==", "הבטיחו את מקום ילדכם עוד היום!").get();
  
  const allKeys = new Set<string>();
  snap.forEach(doc => {
    const payload = doc.data().payload || {};
    Object.keys(payload).forEach(k => allKeys.add(k));
  });

  console.log("All unique keys in form submissions:");
  console.log(Array.from(allKeys));
}

main().catch(console.error);
