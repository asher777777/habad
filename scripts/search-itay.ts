import { adminDb } from "../src/lib/firebase-admin";

async function main() {
  console.log("Searching for איתי in contacts...");
  
  const contactsSnapshot = await adminDb.collection("contacts").get();
  
  contactsSnapshot.forEach((doc) => {
    const data = doc.data();
    const strData = JSON.stringify(data);
    if (strData.includes("איתי")) {
      console.log(`Found in contact: ${doc.id}`);
      console.log(data);
    }
  });
}

main().catch(console.error);
