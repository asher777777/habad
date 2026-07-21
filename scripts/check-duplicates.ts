import { adminDb } from "../src/lib/firebase-admin";

async function checkDuplicates() {
  const contactsRef = adminDb.collection("contacts");
  
  // Avigail
  const avigailQuery = await contactsRef.where("conta_phone", "==", "0542143643").get();
  console.log(`Found ${avigailQuery.size} contacts for Avigail`);
  
  for (const doc of avigailQuery.docs) {
    const data = doc.data();
    console.log(`Contact ID: ${doc.id}`);
    console.log(`Name: ${data.conta_name}`);
    console.log(`Children array size: ${data.children?.length || 0}`);
    console.log(JSON.stringify(data.children, null, 2));
  }
}

checkDuplicates().catch(console.error);
