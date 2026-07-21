import { adminDb } from "../src/lib/firebase-admin";

async function main() {
  const contactsRef = adminDb.collection("contacts");
  // Find all contacts created between 2026-06-15 and 2026-06-16
  const snapshot = await contactsRef
    .where("createdAt", ">=", "2026-06-15T00:00:00.000Z")
    .where("createdAt", "<=", "2026-06-16T00:00:00.000Z")
    .get();

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`\nContact: ${data.conta_name}`);
    console.log(`Events:`, JSON.stringify(data.events, null, 2));
    console.log(`Form Submissions:`, JSON.stringify(data.form_submissions, null, 2));
  });
}

main().catch(console.error);
