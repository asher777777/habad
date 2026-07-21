import { adminDb } from "../src/lib/firebase-admin";

async function fixLastNames() {
  const submissionsRef = adminDb.collection("form_submissions");
  const contactsRef = adminDb.collection("contacts");
  
  const snap = await submissionsRef.where("formName", "==", "הבטיחו את מקום ילדכם עוד היום!").get();
  
  let fixedCount = 0;
  for (const doc of snap.docs) {
    const payload = doc.data().payload || {};
    if (!payload["שם משפחה"] || payload["שם משפחה"].trim() === "") {
      const contactId = doc.data().contactId;
      const contactDoc = await contactsRef.doc(contactId).get();
      if (contactDoc.exists) {
        const contactData = contactDoc.data() as any;
        
        let lastName = contactData.child_last_name || contactData.last_name || "";
        
        if (!lastName && contactData.children && contactData.children.length > 0) {
            lastName = contactData.children[0].last_name || "";
        }
        
        // If still no last name, try to extract from mother's name or conta_name
        if (!lastName) {
            const nameToSplit = contactData.mother_name || contactData.father_name || contactData.conta_name || "";
            const parts = nameToSplit.split(" ");
            if (parts.length > 1) {
                lastName = parts.slice(1).join(" ");
            }
        }
        
        if (lastName) {
            await doc.ref.update({
                "payload.שם משפחה": lastName
            });
            fixedCount++;
            console.log(`Fixed last name for ${contactData.conta_name} -> ${lastName}`);
        }
      }
    }
  }
  
  console.log(`Fixed ${fixedCount} missing last names.`);
}

fixLastNames().catch(console.error);
