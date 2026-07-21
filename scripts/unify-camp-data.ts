import { adminDb } from "../src/lib/firebase-admin";

async function unifyCampData() {
  console.log("Starting to unify static camp registrations into form_submissions...");
  const contactsRef = adminDb.collection("contacts");
  const submissionsRef = adminDb.collection("form_submissions");

  // Get all contacts with the old static camp tag
  const snapshot = await contactsRef.where("tg1", "==", "קייטנה_תשסו").get();
  
  if (snapshot.empty) {
    console.log("No static camp registrations found.");
    return;
  }

  const formTitle = "הבטיחו את מקום ילדכם עוד היום!";
  let addedCount = 0;

  for (const doc of snapshot.docs) {
    const contactId = doc.id;
    const data = doc.data();

    // Check if this contact already has a submission for this form to avoid duplicates
    const existing = await submissionsRef
      .where("contactId", "==", contactId)
      .where("formName", "==", formTitle)
      .get();

    if (!existing.empty) {
      console.log(`Contact ${data.conta_name} already unified.`);
      continue;
    }

    // Determine payment status based on events or tg2
    const hasPaid = data.tg2 === "שולם קייטנה" || (data.events || []).some((e: any) => e.title === "תשלום קייטנה התקבל");
    const finalStatus = hasPaid ? "תשלום בוצע" : "ממתין לתשלום";
    const amountPaid = data.total_spent || 0;

    const payload = {
      "שם פרטי של הילד": data.child_first_name || "",
      "שם משפחה": data.child_last_name || "",
      "תעודת זהות": data.child_id_number || "",
      "עולה לכיתה": data.child_grade || "",
      "מגדר": data.gender || "",
      "קיימת רגישות כלשהי?": data.allergies_has || "לא",
      "פרטי הרגישות": data.allergies_details || "",
      "שם האם": data.mother_name || "",
      "טלפון האם": data.mother_phone || "",
      "שם האב": data.father_name || "",
      "טלפון האב": data.father_phone || "",
      "אמצעי תשלום": "טופס ישן",
      amountPaid: amountPaid,
      status: finalStatus
    };

    await submissionsRef.add({
      contactId: contactId,
      ownerId: data.ownerId || "1",
      formName: formTitle,
      formPage: "camp-registration-legacy",
      submissionDate: data.createdAt || new Date().toISOString(),
      payload: payload
    });

    console.log(`Unified: ${data.conta_name}`);
    addedCount++;
  }

  console.log(`\nSuccessfully unified ${addedCount} legacy camp registrations into the main form list!`);
}

unifyCampData().catch(console.error);
