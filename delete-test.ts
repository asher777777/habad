import { adminDb } from "./src/lib/firebase-admin";

async function main() {
  await adminDb.collection("services").doc("katyna").delete();
  console.log("Deleted katyna from services");
  
  const doc = await adminDb.collection("services").doc("katyna").get();
  console.log("Does katyna still exist in services?", doc.exists);
}

main().catch(console.error);
