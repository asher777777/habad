import { adminDb } from "../src/lib/firebase-admin";

async function check() {
  const contactsSnap = await adminDb.collection("contacts").get();
  console.log(`Found ${contactsSnap.size} contacts.`);
  let count = 0;
  for (const doc of contactsSnap.docs) {
    const data = doc.data();
    if (data.form_submissions && data.form_submissions.length > 0) {
      console.log(`Contact ${doc.id} has ${data.form_submissions.length} forms:`, data.form_submissions);
      count++;
    } else {
      // maybe check last_form_name
      if (data.last_form_name) {
         console.log(`Contact ${doc.id} HAS NO form_submissions array, but has last_form_name: ${data.last_form_name}`);
         count++;
      }
    }
  }
  console.log(`Total contacts with form data: ${count}`);
}
check();
