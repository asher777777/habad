import { adminDb } from "../src/lib/firebase-admin";

async function findMissingCampRecords() {
  const contactsRef = adminDb.collection("contacts");
  const snap = await contactsRef.get();
  
  const allCampContacts = new Map<string, any>();
  const bySource: Record<string, number> = {};

  snap.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    let isCamp = false;
    let source = "";

    // Criteria 1: Tag 1
    if (data.tg1 === "קייטנה_תשסו") {
      isCamp = true;
      source = "tg1=קייטנה_תשסו";
    }
    
    // Criteria 2: Tag 2
    if (!isCamp && (data.tg2 === "שולם קייטנה" || data.tg2 === "ממתין לתשלום קייטנה")) {
      isCamp = true;
      source = "tg2=" + data.tg2;
    }

    // Criteria 3: Events
    if (!isCamp && data.events && Array.isArray(data.events)) {
      if (data.events.some((e: any) => e.title?.includes("קייטנה") || e.title?.includes("הבטיחו את מקום"))) {
        isCamp = true;
        source = "events_title";
      }
    }

    // Criteria 4: Form submissions array
    if (!isCamp && data.form_submissions && Array.isArray(data.form_submissions)) {
      if (data.form_submissions.some((fs: any) => fs.name?.includes("קייטנה") || fs.name?.includes("הבטיחו את מקום"))) {
        isCamp = true;
        source = "form_submissions_array";
      }
    }

    // Criteria 5: specific fields like child_grade
    if (!isCamp && data.child_grade) {
      isCamp = true;
      source = "child_grade_field";
    }

    if (isCamp) {
      allCampContacts.set(id, { id, name: data.conta_name, source });
      bySource[source] = (bySource[source] || 0) + 1;
    }
  });

  console.log(`Total unique camp contacts found in CRM: ${allCampContacts.size}`);
  console.log("Breakdown by source criteria:", bySource);

  // Now compare with what's in form_submissions table
  const submissionsRef = adminDb.collection("form_submissions");
  const subSnap = await submissionsRef.where("formName", "==", "הבטיחו את מקום ילדכם עוד היום!").get();
  
  const inFormsTable = new Set<string>();
  subSnap.forEach(doc => {
    inFormsTable.add(doc.data().contactId);
  });

  console.log(`Total in form_submissions table: ${inFormsTable.size}`);

  const missing = Array.from(allCampContacts.values()).filter(c => !inFormsTable.has(c.id));
  console.log(`\nMissing from forms table (${missing.length}):`);
  missing.forEach(m => console.log(`- ${m.name} (${m.id}) [Found via: ${m.source}]`));
}

findMissingCampRecords().catch(console.error);
