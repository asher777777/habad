import { adminDb } from "../src/lib/firebase-admin";

async function main() {
  const collections = await adminDb.listCollections();
  console.log("Collections:", collections.map(c => c.id));
}

main().catch(console.error);
