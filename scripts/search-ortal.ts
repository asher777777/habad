import { adminDb } from "../src/lib/firebase-admin";

async function main() {
  const contactsRef = adminDb.collection("contacts");
  const snapshot = await contactsRef.get();
  let found = false;
  snapshot.forEach(doc => {
    const data = doc.data();
    const name = (data.conta_name || "").toLowerCase();
    const fname = (data.father_name || "").toLowerCase();
    const mname = (data.mother_name || "").toLowerCase();
    if (name.includes("אורטל") || fname.includes("אורטל") || mname.includes("אורטל")) {
      console.log(`Found Ortal: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
      found = true;
    }
  });
  if (!found) {
    console.log("Ortal not found in contacts");
  }

  const submissionsRef = adminDb.collection("form_submissions");
  const subSnap = await submissionsRef.get();
  subSnap.forEach(doc => {
    const data = doc.data();
    const payloadStr = JSON.stringify(data.payload || {});
    if (payloadStr.includes("אורטל")) {
      console.log(`Found Ortal in submissions: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
    }
  });
}

main().catch(console.error);
