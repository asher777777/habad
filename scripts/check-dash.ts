import { adminDb } from "../src/lib/firebase-admin";

async function checkYaara() {
  const contact = await adminDb.collection("contacts").doc("j91V1Z5tvCpRu0MQfz5q").get();
  console.log(JSON.stringify(contact.data()?.children, null, 2));
  
  const omer = await adminDb.collection("contacts").doc("xuFk0sJmcpuSIvBBtFVI").get(); // Meli Ashkenazi
  console.log(JSON.stringify(omer.data()?.children, null, 2));
}
checkYaara().catch(console.error);
