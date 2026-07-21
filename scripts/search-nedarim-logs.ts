import { adminDb } from "../src/lib/firebase-admin";

async function main() {
  console.log("Searching for יהלי in contacts...");
  
  const contactsSnapshot = await adminDb.collection("contacts").get();
  let found = 0;
  
  contactsSnapshot.forEach((doc) => {
    const data = doc.data();
    const strData = JSON.stringify(data);
    if (strData.includes("יהלי")) {
      console.log(`Found in contact: ${doc.id}`);
      console.log(data);
      found++;
    }
  });
  
  console.log(`\nSearching for יהלי in form_submissions...`);
  const formsSnapshot = await adminDb.collection("form_submissions").get();
  formsSnapshot.forEach((doc) => {
    const data = doc.data();
    const strData = JSON.stringify(data);
    if (strData.includes("יהלי")) {
      console.log(`Found in form_submission: ${doc.id}`);
      console.log(data);
      found++;
    }
  });

  console.log(`Total found: ${found}`);
}

main().catch(console.error);
