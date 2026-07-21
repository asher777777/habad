import { adminDb } from "../src/lib/firebase-admin";

async function backfillMissingAndCheckTotal() {
  const contactsRef = adminDb.collection("contacts");
  const submissionsRef = adminDb.collection("form_submissions");
  
  // 1. Backfill the 5 missing ones
  const missingIds = ["xuFk0sJmcpuSIvBBtFVI", "j91V1Z5tvCpRu0MQfz5q", "rpRlKCgjHZKuMCUliY9T", "lQB7RNlrdgw143so90T1", "Q6Y6sdOevlLdknIMM4Qi"];
  
  let addedCount = 0;
  for (const contactId of missingIds) {
    const doc = await contactsRef.doc(contactId).get();
    if (!doc.exists) continue;
    const data = doc.data() as any;

    // Check if exists
    const existing = await submissionsRef.where("contactId", "==", contactId).where("formName", "==", "הבטיחו את מקום ילדכם עוד היום!").get();
    if (!existing.empty) continue;

    const hasPaid = data.tg2 === "שולם קייטנה" || (data.events || []).some((e: any) => e.title === "תשלום קייטנה התקבל");
    const finalStatus = hasPaid ? "תשלום בוצע" : "ממתין לתשלום";
    
    // We try to pull from `children` array if `child_first_name` is empty
    let childFirstName = data.child_first_name || "";
    let childLastName = data.child_last_name || "";
    let childGrade = data.child_grade || "";
    let childId = data.child_id_number || "";
    
    if (!childFirstName && data.children && data.children.length > 0) {
      childFirstName = data.children[0].first_name || "";
      childLastName = data.children[0].last_name || "";
      childGrade = data.children[0].grade || "";
      childId = data.children[0].id_number || "";
    }

    const payload = {
      "שם פרטי של הילד": childFirstName || "",
      "שם משפחה": childLastName || "",
      "תעודת זהות": childId || "",
      "עולה לכיתה": childGrade || "",
      "מגדר": data.gender || "",
      "קיימת רגישות כלשהי?": data.allergies_has || "לא",
      "פרטי הרגישות": data.allergies_details || "",
      "שם האם": data.mother_name || data.conta_name || "",
      "טלפון האם": data.mother_phone || data.conta_phone || "",
      "שם האב": data.father_name || "",
      "טלפון האב": data.father_phone || "",
      "אמצעי תשלום": "טופס ישן (שוחזר)",
      amountPaid: data.total_spent || 0,
      status: finalStatus
    };

    // Clean empty
    Object.keys(payload).forEach(k => {
      if ((payload as any)[k] === "" || (payload as any)[k] === undefined) {
        delete (payload as any)[k];
      }
    });

    await submissionsRef.add({
      contactId: contactId,
      ownerId: data.ownerId || "1",
      formName: "הבטיחו את מקום ילדכם עוד היום!",
      formPage: "camp-registration-recovered",
      submissionDate: data.createdAt || new Date().toISOString(),
      payload: payload
    });
    console.log(`Backfilled: ${data.conta_name}`);
    addedCount++;
  }

  // 2. Count total submissions for the camp form
  const finalSnap = await submissionsRef.where("formName", "==", "הבטיחו את מקום ילדכם עוד היום!").get();
  console.log(`\nFinal count in form_submissions for camp: ${finalSnap.size}`);
  
  // 3. Are there other forms?
  const allFormsSnap = await submissionsRef.get();
  const formCounts: Record<string, number> = {};
  allFormsSnap.forEach(doc => {
    const fn = doc.data().formName || "Unknown";
    formCounts[fn] = (formCounts[fn] || 0) + 1;
  });
  console.log(`All forms in DB:`, formCounts);
}

backfillMissingAndCheckTotal().catch(console.error);
