import { adminDb } from "../src/lib/firebase-admin";

async function main() {
  const contactsSnapshot = await adminDb.collection("contacts").get();
  
  contactsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.events && Array.isArray(data.events)) {
      data.events.forEach(event => {
        const time = event.time || "";
        if (time.includes("2026-06-15")) {
          console.log(`Found event on 15/06 in contact ${data.conta_name} (${doc.id}):`, event);
        }
      });
    }
  });
}

main().catch(console.error);
