import { adminDb } from "../src/lib/firebase-admin";

async function normalizePayloads() {
  const submissionsRef = adminDb.collection("form_submissions");
  const snap = await submissionsRef.where("formName", "==", "הבטיחו את מקום ילדכם עוד היום!").get();
  
  let updatedCount = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const oldPayload = data.payload || {};
    
    // We only want the specific Hebrew keys
    const newPayload: Record<string, any> = {};

    // Mapping from raw english/system keys to the required Hebrew keys, if they exist in oldPayload
    newPayload["שם פרטי של הילד"] = oldPayload["שם פרטי של הילד"] || oldPayload.child_first_name || "";
    newPayload["שם משפחה"] = oldPayload["שם משפחה"] || oldPayload.child_last_name || "";
    newPayload["תעודת זהות"] = oldPayload["תעודת זהות"] || oldPayload.child_id_number || "";
    newPayload["עולה לכיתה"] = oldPayload["עולה לכיתה"] || oldPayload.child_grade || "";
    newPayload["מגדר"] = oldPayload["מגדר"] || oldPayload.gender || "";
    newPayload["קיימת רגישות כלשהי?"] = oldPayload["קיימת רגישות כלשהי?"] || oldPayload.allergies_has || "";
    newPayload["פרטי הרגישות"] = oldPayload["פרטי הרגישות"] || oldPayload.allergies_details || "";
    
    // Name mapping
    newPayload["שם האם"] = oldPayload["שם האם"] || oldPayload.mother_name || oldPayload.conta_name || "";
    newPayload["טלפון האם"] = oldPayload["טלפון האם"] || oldPayload.mother_phone || oldPayload.conta_phone || "";
    newPayload["שם האב"] = oldPayload["שם האב"] || oldPayload.father_name || "";
    newPayload["טלפון האב"] = oldPayload["טלפון האב"] || oldPayload.father_phone || "";
    
    newPayload["בחירת מסלול קייטנה"] = oldPayload["בחירת מסלול קייטנה"] || "";
    newPayload["אישור הצהרת בריאות"] = oldPayload["אישור הצהרת בריאות"] || "";
    newPayload["אמצעי תשלום"] = oldPayload["אמצעי תשלום"] || "טופס ישן";
    newPayload["amountPaid"] = oldPayload.amountPaid || oldPayload.payment_amount || oldPayload.total_spent || 0;
    
    let status = oldPayload.status || oldPayload.tg2 || "";
    if (status === "שולם קייטנה") status = "תשלום בוצע";
    newPayload["status"] = status;

    // Filter out completely empty keys
    Object.keys(newPayload).forEach(k => {
      if (newPayload[k] === "" || newPayload[k] === undefined) {
        delete newPayload[k];
      }
    });

    await doc.ref.update({
      payload: newPayload
    });
    updatedCount++;
  }

  console.log(`Normalized ${updatedCount} submissions to have clean unified columns.`);
}

normalizePayloads().catch(console.error);
