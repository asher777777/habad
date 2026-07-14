import { adminDb } from "./src/lib/firebase-admin";

async function main() {
  const services = await adminDb.collection("services").get();
  console.log("--- SERVICES ---");
  services.forEach(doc => {
    console.log(`ID: ${doc.id}, slug in data: ${doc.data().slug}, type in data: ${doc.data().type}`);
  });

  const landing = await adminDb.collection("landing").get();
  console.log("--- LANDING ---");
  landing.forEach(doc => {
    console.log(`ID: ${doc.id}, slug in data: ${doc.data().slug}, type in data: ${doc.data().type}`);
  });
}

main().catch(console.error);
