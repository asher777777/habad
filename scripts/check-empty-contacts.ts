import { adminDb } from "../src/lib/firebase-admin";

async function main() {
  const contactsSnapshot = await adminDb.collection("contacts").get();
  
  contactsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (!data.conta_phone || !data.conta_name) {
      console.log(`Found empty contact: ${doc.id}`);
      console.log(data);
    }
  });
}

main().catch(console.error);
