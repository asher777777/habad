import { getContacts, getCRMStats } from "./src/features/crm/actions";

async function test() {
  try {
    console.log("Fetching contacts...");
    const res = await getContacts({});
    console.log("Contacts count:", res.total);
    const stats = await getCRMStats();
    console.log("Stats:", stats);
  } catch (e) {
    console.error("Error occurred:", e);
  }
}

test();
