import { adminDb } from "./src/lib/firebase-admin";

async function check() {
  try {
    const snap = await adminDb.collection("contacts").get();
    const owners: any = {};
    snap.docs.forEach(d => {
      const owner = d.data().ownerId || "missing";
      owners[owner] = (owners[owner] || 0) + 1;
    });
    console.log("Contacts by ownerId:", owners);
  } catch (e) {
    console.error(e);
  }
}
check();
