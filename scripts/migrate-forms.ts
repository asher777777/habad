import { adminDb } from "../src/lib/firebase-admin";

async function migrateForms() {
  console.log("Starting form submissions migration...");
  
  try {
    const contactsSnap = await adminDb.collection("contacts").get();
    let migratedCount = 0;

    for (const doc of contactsSnap.docs) {
      const data = doc.data();
      const contactId = doc.id;
      
      let formSubmissions = data.form_submissions || [];
      if (formSubmissions.length === 0 && data.last_form_name) {
        // Fallback to last_form_name if array is empty (which it was previously)
        formSubmissions = [{
          name: data.last_form_name,
          page: data.last_form_page || "",
          date: data.last_form_submission_date || data.createdAt || new Date().toISOString()
        }];
      }
      
      if (formSubmissions.length === 0) continue;

      // Extract a payload copy of what the contact currently looks like
      // Exclude system fields like events and form_submissions to avoid huge nested loops
      const payload = { ...data };
      delete payload.events;
      delete payload.form_submissions;
      
      for (const form of formSubmissions) {
        // Skip if this specific form already has a matching independent record 
        // to prevent duplicate migrations if script is run multiple times
        const existingSnap = await adminDb.collection("form_submissions")
          .where("contactId", "==", contactId)
          .where("formName", "==", form.name || "")
          .where("submissionDate", "==", form.date || "")
          .limit(1)
          .get();

        if (existingSnap.empty) {
          await adminDb.collection("form_submissions").add({
            contactId,
            ownerId: data.ownerId || "1",
            formName: form.name || "Unknown Form",
            formPage: form.page || "",
            submissionDate: form.date || data.createdAt || new Date().toISOString(),
            payload,
            amountPaid: 0,
            status: data.status || "active",
            isMigrated: true
          });
          migratedCount++;
        }
      }
    }

    console.log(`Migration complete! Successfully migrated ${migratedCount} form submissions.`);
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrateForms();
